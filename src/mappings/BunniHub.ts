import { BigInt, ByteArray, crypto, Address, ethereum, Bytes, log } from "@graphprotocol/graph-ts";
import { Compound, Deposit, NewBunni, PayProtocolFee, SetProtocolFee, Withdraw } from "../../generated/BunniHub/BunniHub";
import { ERC20 } from "../../generated/BunniHub/ERC20";
import { UniswapV3Pool } from "../../generated/BunniHub/UniswapV3Pool";
import { Multicall3, Multicall3__aggregateResult } from "../../generated/BunniHub/Multicall3";

import { BUNNI_HUB } from "../utils/constants";
import { getBunni, getBunniToken, getPool } from "../utils/entities";
import { uniswapV3PositionKey } from "../utils/helpers";
import { tenPow } from "../utils/math";
import { Pool } from "../../generated/schema";

export function handleCompound(event: Compound): void {
  let bunniToken = getBunniToken(event.params.bunniKeyHash);

  let liquidity = bunniToken.liquidity;
  liquidity = liquidity.plus(event.params.liquidity);
  bunniToken.liquidity = liquidity;

  bunniToken.save();
}

export function handleDeposit(event: Deposit): void {
  let bunniToken = getBunniToken(event.params.bunniKeyHash);

  let liquidity = bunniToken.liquidity;
  liquidity = liquidity.plus(event.params.liquidity);
  bunniToken.liquidity = liquidity;

  bunniToken.save();
}

export function handleNewBunni(event: NewBunni): void {
  let bunni = getBunni();

  let pool = getPool(event.params.pool);
  let bunniToken = getBunniToken(event.params.bunniKeyHash);
  let bunniTokenContract = ERC20.bind(event.params.token);
  let poolContract = UniswapV3Pool.bind(event.params.pool);

  let name = bunniTokenContract.name();
  let symbol = bunniTokenContract.symbol();
  let decimals = bunniTokenContract.decimals();

  bunniToken.name = name;
  bunniToken.symbol = symbol;
  bunniToken.address = event.params.token;
  bunniToken.decimals = BigInt.fromI32(decimals);
  bunniToken.precision = tenPow(decimals);

  bunniToken.pool = pool.id;
  bunniToken.tickLower = BigInt.fromI32(event.params.tickLower);
  bunniToken.tickUpper = BigInt.fromI32(event.params.tickUpper);

  bunniToken.positionKey = uniswapV3PositionKey(BUNNI_HUB, event.params.tickLower, event.params.tickUpper)

  // initialize total pool liquidity in the range of the BunniToken's price range
  // If we are iterating ascending and we found an initialized tick we immediately apply
  // it to the current processed tick we are building.
  // If we are iterating descending, we don't want to apply the net liquidity until the following tick.
  // The pool's current tick isn't necessarily a tick that can actually be initialized.
  // Find the nearest valid tick given the tick spacing.
  const activeTick = BigInt.fromI32((Math.floor((pool.tick.toI32() as f32) / (pool.tickSpacing.toI32() as f32)) as i32) * pool.tickSpacing.toI32());
  if (activeTick.gt(bunniToken.tickUpper)) {
    // tick to the right of range
    let liquidity = poolContract.liquidity();
    let liquidityDeltas = multicallTicksLiquidityDelta(pool, bunniToken.tickLower, activeTick);
    let previousLiquidityNet = liquidityDeltas.get(activeTick.toI32());

    // move tick to tickUpper
    for (let tick = activeTick.toI32() - pool.tickSpacing.toI32(); tick >= bunniToken.tickUpper.toI32(); tick -= pool.tickSpacing.toI32()) {
      liquidity = liquidity.minus(previousLiquidityNet);
      previousLiquidityNet = liquidityDeltas.get(tick);
    }

    // start counting liquidity in range
    for (let tick = bunniToken.tickUpper.toI32() - pool.tickSpacing.toI32(); tick >= bunniToken.tickLower.toI32(); tick -= pool.tickSpacing.toI32()) {
      liquidity = liquidity.minus(previousLiquidityNet);
      previousLiquidityNet = liquidityDeltas.get(tick);
      bunniToken.poolLiquidityInRange = bunniToken.poolLiquidityInRange.plus(liquidity);
    }
  } else if (activeTick.lt(bunniToken.tickLower)) {
    // tick to the left of range
    let liquidity = poolContract.liquidity();
    let liquidityDeltas = multicallTicksLiquidityDelta(pool, activeTick.plus(pool.tickSpacing), bunniToken.tickUpper);

    // move tick to tickLower
    for (let tick = activeTick.toI32() + pool.tickSpacing.toI32(); tick < bunniToken.tickLower.toI32(); tick += pool.tickSpacing.toI32()) {
      liquidity = liquidity.plus(liquidityDeltas.get(tick));
    }

    // start counting liquidity in range
    for (let tick = bunniToken.tickLower.toI32(); tick < bunniToken.tickUpper.toI32(); tick += pool.tickSpacing.toI32()) {
      liquidity = liquidity.plus(liquidityDeltas.get(tick));
      bunniToken.poolLiquidityInRange = bunniToken.poolLiquidityInRange.plus(liquidity);
    }
  } else {
    // tick within range
    let liquidity = poolContract.liquidity();
    let liquidityDeltas = multicallTicksLiquidityDelta(pool, bunniToken.tickLower, bunniToken.tickUpper);
    let currentTickLiquidity = BigInt.fromString(liquidity.toString()); // make a copy

    // count liquidity in [tick + tickSpacing, tickUpper)
    for (let tick = activeTick.toI32() + pool.tickSpacing.toI32(); tick < bunniToken.tickUpper.toI32(); tick += pool.tickSpacing.toI32()) {
      liquidity = liquidity.plus(liquidityDeltas.get(tick));
      bunniToken.poolLiquidityInRange = bunniToken.poolLiquidityInRange.plus(liquidity);
    }

    // reset liquidity
    liquidity = currentTickLiquidity;

    // count current tick liquidity
    bunniToken.poolLiquidityInRange = bunniToken.poolLiquidityInRange.plus(liquidity);

    // count liquidity in [tickLower, tick - tickSpacing]
    let previousLiquidityNet = liquidityDeltas.get(activeTick.toI32()); // Define previousLiquidityNet
    for (let tick = activeTick.toI32() - pool.tickSpacing.toI32(); tick >= bunniToken.tickLower.toI32(); tick -= pool.tickSpacing.toI32()) {
      liquidity = liquidity.minus(previousLiquidityNet);
      previousLiquidityNet = liquidityDeltas.get(tick); // Update the previousLiquidityNet value correctly
      bunniToken.poolLiquidityInRange = bunniToken.poolLiquidityInRange.plus(liquidity);
    }
  }

  bunniToken.save();

  let bunniTokensOfPool = pool.bunniTokens;
  bunniTokensOfPool.push(bunniToken.id);
  pool.bunniTokens = bunniTokensOfPool;
  pool.save();
}

export function handlePayProtocolFee(event: PayProtocolFee): void {
  let bunni = getBunni();
  bunni.save();

  const eventReceipt = event.receipt;
  if (eventReceipt) {
    const eventLogs = eventReceipt.logs;
    const signatureHash = crypto.keccak256(ByteArray.fromUTF8("Compound(address,bytes32,uint128,uint256,uint256)"));

    for (let i = 0; i < eventLogs.length; i++) {
      if (eventLogs[i].topics[0].toHex() == signatureHash.toHex()) {
        let bunniToken = getBunniToken(eventLogs[i].topics[2]);
        bunniToken.collectedFeesToken0 = bunniToken.collectedFeesToken0.plus(event.params.amount0);
        bunniToken.collectedFeesToken1 = bunniToken.collectedFeesToken1.plus(event.params.amount1);
        bunniToken.save();
      }
    }
  }
}

export function handleSetProtocolFee(event: SetProtocolFee): void {
  let bunni = getBunni();
  bunni.protocolFee = event.params.newProtocolFee;
  bunni.save();
}

export function handleWithdraw(event: Withdraw): void {
  let bunniToken = getBunniToken(event.params.bunniKeyHash);

  let liquidity = bunniToken.liquidity;
  liquidity = liquidity.minus(event.params.liquidity);
  bunniToken.liquidity = liquidity;

  bunniToken.save();
}

function multicallTicksLiquidityDelta(pool: Pool, tickLower: BigInt, tickUpper: BigInt): Map<number, BigInt> {
  let ticksSig = Bytes.fromHexString("0xf30dba93");
  let multicallCalls: ethereum.Tuple[] = new Array<ethereum.Tuple>();
  for (let tick = tickLower.toI32(); tick <= tickUpper.toI32(); tick += pool.tickSpacing.toI32()) {
    let callStruct = new ethereum.Tuple(2);
    callStruct[0] = ethereum.Value.fromAddress(Address.fromBytes(pool.address));
    callStruct[1] = ethereum.Value.fromBytes(ticksSig.concat(ethereum.encode(ethereum.Value.fromI32(tick))!));
    multicallCalls.push(callStruct);
  }
  let multicallResult: BigInt[] = aggregate(multicallCalls).map<BigInt>((rawBytes) => ethereum.decode("(uint128,int128,uint256,uint256,int56,uint160,uint32,bool)", rawBytes)!.toTuple().at(1).toBigInt());
  let result = new Map<number, BigInt>();
  let i = 0;
  for (let tick = tickLower.toI32(); tick <= tickUpper.toI32(); tick += pool.tickSpacing.toI32()) {
    result.set(tick, multicallResult.at(i));
    i++;
  }
  return result;
}

function aggregate(
  calls: Array<ethereum.Tuple>,
  batchSize: i32 = 2500
): Bytes[] {
  let multicall = Multicall3.bind(Address.fromString("0xcA11bde05977b3631167028862bE2a173976CA11"));
  let numBatches = Math.ceil((calls.length as f32) / (batchSize as f32));
  log.info("numBatches = {}", [numBatches.toString()]);
  let result: Bytes[] = [];
  for (let batch: i32 = 0; batch < numBatches; batch++) {
    let callsBatch = calls.slice(batch * batchSize, (batch + 1) * batchSize);
    let batchResult = multicall.call(
      "aggregate",
      "aggregate((address,bytes)[]):(uint256,bytes[])",
      [ethereum.Value.fromTupleArray(callsBatch)]
    );
    result = result.concat(batchResult[1].toBytesArray());
  }

  return result;
}