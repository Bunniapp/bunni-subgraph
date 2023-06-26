import { Address, BigInt, ByteArray, crypto } from "@graphprotocol/graph-ts";
import { Compound, Deposit, NewBunni, PayProtocolFee, SetProtocolFee, Withdraw } from "../types/BunniHub/BunniHub";

import { getBunniToken, getPool, getToken } from "../utils/entities";
import { convertToDecimals } from "../utils/math";
import { fetchTokenDecimals, fetchTokenName, fetchTokenSymbol } from "../utils/token";

export function handleCompound(event: Compound): void {
  let bunniToken = getBunniToken(event.params.bunniKeyHash);

  /// load the ancillary entities
  let pool = getPool(Address.fromBytes(bunniToken.pool));
  let token0 = getToken(Address.fromBytes(pool.token0));
  let token1 = getToken(Address.fromBytes(pool.token1));

  /// update the position liquidity
  bunniToken.liquidity = bunniToken.liquidity.plus(event.params.liquidity);

  /// update the position reserve and shares
  let amount0 = convertToDecimals(event.params.amount0, token0.decimals);
  let amount1 = convertToDecimals(event.params.amount1, token1.decimals);
  bunniToken.token0Reserve = bunniToken.token0Reserve.plus(amount0);
  bunniToken.token1Reserve = bunniToken.token1Reserve.plus(amount1);
  bunniToken.token0Share = bunniToken.token0Reserve.div(bunniToken.totalSupply);
  bunniToken.token1Share = bunniToken.token1Reserve.div(bunniToken.totalSupply);

  /// update the pool aggregates with new amounts
  pool.token0Reserve = pool.token0Reserve.plus(amount0);
  pool.token1Reserve = pool.token1Reserve.plus(amount1);

  bunniToken.save();
  pool.save();
}

export function handleDeposit(event: Deposit): void {
  let bunniToken = getBunniToken(event.params.bunniKeyHash);

  /// load the ancillary entities
  let pool = getPool(Address.fromBytes(bunniToken.pool));
  let token0 = getToken(Address.fromBytes(pool.token0));
  let token1 = getToken(Address.fromBytes(pool.token1));

  /// update the position liquidity
  bunniToken.liquidity = bunniToken.liquidity.plus(event.params.liquidity);
  
  /// update bunni token total supply
  bunniToken.totalSupply = bunniToken.totalSupply.plus(convertToDecimals(event.params.shares, bunniToken.decimals));

  /// update the position reserve and share
  let amount0 = convertToDecimals(event.params.amount0, token0.decimals);
  let amount1 = convertToDecimals(event.params.amount1, token1.decimals);
  bunniToken.token0Reserve = bunniToken.token0Reserve.plus(amount0);
  bunniToken.token1Reserve = bunniToken.token1Reserve.plus(amount1);
  bunniToken.token0Share = bunniToken.token0Reserve.div(bunniToken.totalSupply);
  bunniToken.token1Share = bunniToken.token1Reserve.div(bunniToken.totalSupply);

  /// update the pool aggregates with new amounts
  pool.token0Reserve = pool.token0Reserve.plus(amount0);
  pool.token1Reserve = pool.token1Reserve.plus(amount1);

  bunniToken.save();
  pool.save();
}

export function handleNewBunni(event: NewBunni): void {
  let pool = getPool(event.params.pool);
  let bunniToken = getBunniToken(event.params.bunniKeyHash);

  /// update the token info
  bunniToken.address = event.params.token;
  bunniToken.decimals = fetchTokenDecimals(event.params.token);
  bunniToken.name = fetchTokenName(event.params.token);
  bunniToken.symbol = fetchTokenSymbol(event.params.token);

  /// update the position ticks
  bunniToken.tickLower = BigInt.fromI32(event.params.tickLower);
  bunniToken.tickUpper = BigInt.fromI32(event.params.tickUpper);

  /// add pool to the bunni token entity
  bunniToken.pool = pool.id;

  /// add bunni token to the pool entity
  let bunniTokens = pool.bunniTokens;
  bunniTokens.push(bunniToken.id);
  pool.bunniTokens = bunniTokens;

  bunniToken.save();
  pool.save();
}

export function handlePayProtocolFee(event: PayProtocolFee): void {
  const eventReceipt = event.receipt;

  if (eventReceipt) {
    const eventLogs = eventReceipt.logs;
    const signatureHash = crypto.keccak256(ByteArray.fromUTF8("Compound(address,bytes32,uint128,uint256,uint256)"));

    for (let i = 0; i < eventLogs.length; i++) {
      if (eventLogs[i].topics[0].toHex() == signatureHash.toHex()) {
        let bunniToken = getBunniToken(eventLogs[i].topics[2]);

        /// load the ancillary entities
        let pool = getPool(Address.fromBytes(bunniToken.pool));
        let token0 = getToken(Address.fromBytes(pool.token0));
        let token1 = getToken(Address.fromBytes(pool.token1));

        /// update the bunni token fees
        bunniToken.token0Fees = bunniToken.token0Fees.plus(convertToDecimals(event.params.amount0, token0.decimals));
        bunniToken.token1Fees = bunniToken.token1Fees.plus(convertToDecimals(event.params.amount1, token1.decimals));
        bunniToken.save();

        // update the pool aggregates with new amounts
        pool.token0Fees = pool.token0Fees.plus(convertToDecimals(event.params.amount0, token0.decimals));
        pool.token1Fees = pool.token1Fees.plus(convertToDecimals(event.params.amount1, token1.decimals));
        pool.save();
      }
    }
  }
}

export function handleSetProtocolFee(event: SetProtocolFee): void {}

export function handleWithdraw(event: Withdraw): void {
  let bunniToken = getBunniToken(event.params.bunniKeyHash);

  /// load the ancillary entities
  let pool = getPool(Address.fromBytes(bunniToken.pool));
  let token0 = getToken(Address.fromBytes(pool.token0));
  let token1 = getToken(Address.fromBytes(pool.token1));

  /// update the position liquidity
  bunniToken.liquidity = bunniToken.liquidity.minus(event.params.liquidity);

  /// update bunni token total supply
  bunniToken.totalSupply = bunniToken.totalSupply.minus(convertToDecimals(event.params.shares, bunniToken.decimals));

  /// update the position reserve and shares
  let amount0 = convertToDecimals(event.params.amount0, token0.decimals);
  let amount1 = convertToDecimals(event.params.amount1, token1.decimals);
  bunniToken.token0Reserve = bunniToken.token0Reserve.minus(amount0);
  bunniToken.token1Reserve = bunniToken.token1Reserve.minus(amount1);
  bunniToken.token0Share = bunniToken.token0Reserve.div(bunniToken.totalSupply);
  bunniToken.token1Share = bunniToken.token1Reserve.div(bunniToken.totalSupply);

  /// update the pool aggregates with new amounts
  pool.token0Reserve = pool.token0Reserve.minus(amount0);
  pool.token1Reserve = pool.token1Reserve.minus(amount1);

  bunniToken.save();
  pool.save();
}