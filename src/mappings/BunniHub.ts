import { BigInt } from "@graphprotocol/graph-ts";
import { Compound, Deposit, NewBunni, PayProtocolFee, SetProtocolFee, Withdraw } from "../types/BunniHub/BunniHub";

import { getBunniToken, getPool } from "../utils/entities";
import { convertToDecimals } from "../utils/math";
import { fetchTokenDecimals, fetchTokenName, fetchTokenSymbol } from "../utils/token";

export function handleCompound(event: Compound): void {
  let bunniToken = getBunniToken(event.params.bunniKeyHash);

  /// update the position liquidity
  bunniToken.liquidity = bunniToken.liquidity.plus(event.params.liquidity);

  bunniToken.save();
}

export function handleDeposit(event: Deposit): void {
  let bunniToken = getBunniToken(event.params.bunniKeyHash);
  
  /// update bunni token total supply
  bunniToken.totalSupply = bunniToken.totalSupply.plus(convertToDecimals(event.params.shares, bunniToken.decimals));

  /// update the position liquidity
  bunniToken.liquidity = bunniToken.liquidity.plus(event.params.liquidity);

  bunniToken.save();
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

  bunniToken.pool = pool.id;

  bunniToken.save();
  pool.save();
}

export function handlePayProtocolFee(event: PayProtocolFee): void {}

export function handleSetProtocolFee(event: SetProtocolFee): void {}

export function handleWithdraw(event: Withdraw): void {
  let bunniToken = getBunniToken(event.params.bunniKeyHash);
  
  /// update bunni token total supply
  bunniToken.totalSupply = bunniToken.totalSupply.minus(convertToDecimals(event.params.shares, bunniToken.decimals));

  /// update the position liquidity
  bunniToken.liquidity = bunniToken.liquidity.minus(event.params.liquidity);

  bunniToken.save();
}