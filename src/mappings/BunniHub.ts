import { BigInt, ByteArray, crypto } from "@graphprotocol/graph-ts";
import { Compound, Deposit, NewBunni, PayProtocolFee, SetProtocolFee, Withdraw } from "../../generated/BunniHub/BunniHub";
import { ERC20 } from "../../generated/BunniHub/ERC20";
import { UniswapV3Pool } from "../../generated/BunniHub/UniswapV3Pool";

import { BUNNI_HUB } from "../utils/constants";
import { getBunni, getBunniToken, getPool } from "../utils/entities";
import { uniswapV3PositionKey } from "../utils/helpers";
import { tenPow } from "../utils/math";

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
  if (pool.tick.gt(bunniToken.tickUpper)) {
    // tick to the right of range
    let liquidity = poolContract.liquidity();
    let previousLiquidityNet = poolContract.ticks(pool.tick.toI32()).value1;

    // move tick to tickUpper
    for (let tick = pool.tick.toI32() - pool.tickSpacing.toI32(); tick > bunniToken.tickUpper.toI32(); tick -= pool.tickSpacing.toI32()) {
      let result = poolContract.ticks(tick);
      liquidity = liquidity.minus(previousLiquidityNet);
      previousLiquidityNet = result.value1;
    }

    // start counting liquidity in range
    for (let tick = bunniToken.tickUpper.toI32(); tick >= bunniToken.tickLower.toI32(); tick -= pool.tickSpacing.toI32()) {
      let result = poolContract.ticks(tick);
      liquidity = liquidity.minus(previousLiquidityNet);
      previousLiquidityNet = result.value1;
      bunniToken.poolLiquidityInRange = bunniToken.poolLiquidityInRange.plus(liquidity);
    }
  } else if (pool.tick.lt(bunniToken.tickLower)) {
    // tick to the left of range
    let liquidity = poolContract.liquidity();

    // move tick to tickLower
    for (let tick = pool.tick.toI32() + pool.tickSpacing.toI32(); tick < bunniToken.tickLower.toI32(); tick += pool.tickSpacing.toI32()) {
      let result = poolContract.ticks(tick);
      liquidity = liquidity.plus(result.value1);
    }

    // start counting liquidity in range
    for (let tick = bunniToken.tickLower.toI32(); tick <= bunniToken.tickUpper.toI32(); tick += pool.tickSpacing.toI32()) {
      let result = poolContract.ticks(tick);
      liquidity = liquidity.plus(result.value1);
      bunniToken.poolLiquidityInRange = bunniToken.poolLiquidityInRange.plus(liquidity);
    }
  } else {
    // tick within range
    let liquidity = poolContract.liquidity();
    let currentTickLiquidity = BigInt.fromString(liquidity.toString()); // make a copy

    // count liquidity in [tick + tickSpacing, tickUpper]
    for (let tick = pool.tick.toI32() + pool.tickSpacing.toI32(); tick <= bunniToken.tickUpper.toI32(); tick += pool.tickSpacing.toI32()) {
      let result = poolContract.ticks(tick);
      liquidity = liquidity.plus(result.value1);
      bunniToken.poolLiquidityInRange = bunniToken.poolLiquidityInRange.plus(liquidity);
    }

    // reset liquidity
    liquidity = currentTickLiquidity;
    let previousLiquidityNet = poolContract.ticks(pool.tick.toI32()).value1;

    // count current tick liquidity
    bunniToken.poolLiquidityInRange = bunniToken.poolLiquidityInRange.plus(liquidity);

    // count liquidity in [tickLower, tick - tickSpacing]
    for (let tick = pool.tick.toI32() - pool.tickSpacing.toI32(); tick >= bunniToken.tickLower.toI32(); tick -= pool.tickSpacing.toI32()) {
      let result = poolContract.ticks(tick);
      liquidity = liquidity.minus(previousLiquidityNet);
      previousLiquidityNet = result.value1;
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
