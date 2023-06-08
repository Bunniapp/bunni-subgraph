import { BigInt } from "@graphprotocol/graph-ts";
import { SetParams } from "../../generated/BalancerOracle/BalancerOracle";
import { getBunni } from "../utils/entities";

export function handleSetParams(event: SetParams): void {
   let bunni = getBunni();
   bunni.optionDiscount = BigInt.fromI32(event.params.multiplier);
   bunni.save();
}