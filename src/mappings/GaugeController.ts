import { Bytes, crypto } from "@graphprotocol/graph-ts";
import { NewGauge, VoteForGauge } from "../types/GaugeController/GaugeController";
import { getGauge } from "../utils/entities";

export function handleNewGauge(event: NewGauge): void {
  let gauge = getGauge(Bytes.fromByteArray(crypto.keccak256(event.params.addr)));
  gauge.exists = true;
  gauge.type = event.params.gauge_type;
  gauge.save();
}

export function handleVoteForGauge(event: VoteForGauge): void {}