import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Deposit, Withdraw, VotingEscrow } from "../types/VotingEscrow/VotingEscrow";
import { BroadcastVeBalance } from "../types/Beacon/Beacon";

import { getUser, getVotingLock } from "../utils/entities";
import { convertToDecimals } from "../utils/math";

export function handleDeposit(event: Deposit): void {
  let lock = getVotingLock(getUser(event.params.provider));
  let escrowContract = VotingEscrow.bind(event.address);

  /// update the lock balance and decay rate
  let balanceResult = escrowContract.try_balanceOf(event.params.provider);
  if (!balanceResult.reverted) {
    let timeLeft = event.params.locktime.minus(event.params.ts);
    lock.balance = convertToDecimals(balanceResult.value, BigInt.fromI32(18));
    lock.decay = convertToDecimals(balanceResult.value.div(timeLeft), BigInt.fromI32(18));
  }

  /// update the lock amount, last update and end
  lock.amount = lock.amount.plus(convertToDecimals(event.params.value, BigInt.fromI32(18)));
  lock.lastUpdate = event.params.ts;
  lock.lockEnd = event.params.locktime;

  lock.save();
}

export function handleWithdraw(event: Withdraw): void {
  let lock = getVotingLock(getUser(event.params.provider));

  /// update the lock amount and last update (balance and decay can safely be reset)
  lock.amount = lock.amount.minus(convertToDecimals(event.params.value, BigInt.fromI32(18)));
  lock.balance = BigDecimal.zero();
  lock.decay = BigDecimal.zero();
  lock.lastUpdate = event.params.ts;

  lock.save();
}

export function handleBroadcastVeBalance(event: BroadcastVeBalance): void {
  let lock = getVotingLock(getUser(event.params.user));
  lock.lastBroadcast = event.block.timestamp;
  lock.save();
}