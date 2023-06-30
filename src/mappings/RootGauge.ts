import { BigInt, dataSource } from "@graphprotocol/graph-ts";
import { RelativeWeightCapChanged } from "../types/templates/RootGauge/RootGauge";
import { getGauge } from "../utils/entities";
import { convertToDecimals } from "../utils/math";


export function handleRelativeWeightCapChanged(event: RelativeWeightCapChanged): void {
  let gauge = getGauge(dataSource.context().getBytes("id"));
  gauge.relativeWeightCap = convertToDecimals(event.params.new_relative_weight_cap, BigInt.fromI32(18));
  gauge.save();
}