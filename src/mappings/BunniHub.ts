import { Compound, Deposit, NewBunni, PayProtocolFee, SetProtocolFee, Withdraw } from "../types/BunniHub/BunniHub";

import { getBunniToken } from "../utils/entities";
import { convertToDecimals } from "../utils/math";
import { fetchTokenDecimals, fetchTokenName, fetchTokenSymbol } from "../utils/token";

export function handleCompound(event: Compound): void {}

export function handleDeposit(event: Deposit): void {
  let bunniToken = getBunniToken(event.params.bunniKeyHash);
  
  /// update bunni token total supply
  bunniToken.totalSupply = bunniToken.totalSupply.plus(convertToDecimals(event.params.shares, bunniToken.decimals));

  bunniToken.save();
}

export function handleNewBunni(event: NewBunni): void {
  let bunniToken = getBunniToken(event.params.bunniKeyHash);

  bunniToken.address = event.params.token;
  bunniToken.decimals = fetchTokenDecimals(event.params.token);
  bunniToken.name = fetchTokenName(event.params.token);
  bunniToken.symbol = fetchTokenSymbol(event.params.token);

  bunniToken.save();
}

export function handlePayProtocolFee(event: PayProtocolFee): void {}

export function handleSetProtocolFee(event: SetProtocolFee): void {}

export function handleWithdraw(event: Withdraw): void {
  let bunniToken = getBunniToken(event.params.bunniKeyHash);
  
  /// update bunni token total supply
  bunniToken.totalSupply = bunniToken.totalSupply.minus(convertToDecimals(event.params.shares, bunniToken.decimals));

  bunniToken.save();
}