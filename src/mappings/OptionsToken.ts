import { Address, BigInt, Bytes, crypto } from "@graphprotocol/graph-ts";
import { Exercise, SetOracle, SetTreasury } from "../types/OptionsToken/OptionsToken";
import { SetParams } from "../types/BalancerOracle/BalancerOracle";
import { Minted } from "../types/Minter/Minter";

import { getBunni, getBunniToken, getGauge, getUser, getUserPosition } from "../utils/entities";
import { convertToDecimals } from "../utils/math";

export function handleExercise(event: Exercise): void {
  let bunni = getBunni();
  bunni.wethRedeemed = bunni.wethRedeemed.plus(convertToDecimals(event.params.paymentAmount, BigInt.fromI32(18)));
  bunni.save();
}

export function handleSetOracle(event: SetOracle): void {
  let bunni = getBunni();
  bunni.optionsOracle = event.params.newOracle;
  bunni.save();
}

export function handleSetTreasury(event: SetTreasury): void {
  let bunni = getBunni();
  bunni.optionsTreasury = event.params.newTreasury;
  bunni.save();
}

export function handleSetParams(event: SetParams): void {
  let bunni = getBunni();

  if (Address.fromBytes(bunni.optionsOracle) == Address.zero() || Address.fromBytes(bunni.optionsOracle) == event.address) {
    bunni.optionsMultiplier = convertToDecimals(BigInt.fromI32(event.params.multiplier), BigInt.fromI32(4))
  }

  bunni.save();
}

export function handleMinted(event: Minted): void {
  let gauge = getGauge(Bytes.fromByteArray(crypto.keccak256(event.params.gauge)));
  let bunniToken = getBunniToken(gauge.bunniToken);

  let user = getUser(event.params.recipient);
  let userPosition = getUserPosition(bunniToken, user);

  /// reset aggregates until new amounts calculated
  let oldAmount = userPosition.claimedRewards;
  user.claimedRewards = user.claimedRewards.minus(oldAmount);
  gauge.claimedRewards = gauge.claimedRewards.minus(oldAmount);

  /// update with new amounts
  let newAmount = convertToDecimals(event.params.minted, BigInt.fromI32(18));
  gauge.claimedRewards = gauge.claimedRewards.plus(newAmount);
  user.claimedRewards = user.claimedRewards.plus(newAmount);
  userPosition.claimedRewards = newAmount;

  gauge.save();
  user.save();
  userPosition.save();
}