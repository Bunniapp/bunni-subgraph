import { BigInt } from "@graphprotocol/graph-ts";
import { MiningParametersUpdated } from "../types/TokenAdmin/TokenAdmin";
import { getBunni } from "../utils/entities";
import { convertToDecimals } from "../utils/math";


export function handleMiningParametersUpdated(event: MiningParametersUpdated): void {
  let bunni = getBunni();
  bunni.inflationRate = convertToDecimals(event.params.rate, BigInt.fromI32(18));
  bunni.save();
}