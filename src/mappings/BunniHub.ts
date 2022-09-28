import { Address, BigInt } from "@graphprotocol/graph-ts";
import { BunniHub, Compound, Deposit, NewBunni, OwnershipTransferred, PayProtocolFee, SetProtocolFee, Withdraw } from "../../generated/BunniHub/BunniHub";
import { ERC20 } from "../../generated/BunniHub/ERC20";
import { BunniToken } from "../../generated/schema";

import { getBunniToken, getPool } from "../utils/entities";
import { tenPow } from "../utils/math";

export function handleCompound(event: Compound): void {}

export function handleDeposit(event: Deposit): void {}

export function handleNewBunni(event: NewBunni): void {
  let pool = getPool(event.params.pool);
  let bunniToken = getBunniToken(event.params.token);
  let bunniTokenContract = ERC20.bind(event.params.token);

  let name = bunniTokenContract.name();
  let symbol = bunniTokenContract.symbol();
  let decimals = bunniTokenContract.decimals();

  bunniToken.name = name;
  bunniToken.symbol = symbol;
  bunniToken.decimals = BigInt.fromI32(decimals);
  bunniToken.precision = tenPow(decimals);

  bunniToken.pool = pool.id;
  bunniToken.tickLower = BigInt.fromI32(event.params.tickLower);
  bunniToken.tickUpper = BigInt.fromI32(event.params.tickUpper);
  bunniToken.save();
}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {}

export function handlePayProtocolFee(event: PayProtocolFee): void {}

export function handleSetProtocolFee(event: SetProtocolFee): void {}

export function handleWithdraw(event: Withdraw): void {}
