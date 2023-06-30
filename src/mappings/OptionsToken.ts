import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Exercise, SetOracle, SetTreasury } from "../types/OptionsToken/OptionsToken";
import { SetParams } from "../types/BalancerOracle/BalancerOracle";

import { getBunni } from "../utils/entities";
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

  if (event.address == Address.fromBytes(bunni.optionsOracle)) {
    bunni.optionsMultiplier = convertToDecimals(BigInt.fromI32(event.params.multiplier), BigInt.fromI32(4))
  }

  bunni.save();
}