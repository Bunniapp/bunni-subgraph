import { Bytes, crypto } from "@graphprotocol/graph-ts";
import { NewGauge, VoteForGauge } from "../types/GaugeController/GaugeController";
import { getGauge, getUser, getVote } from "../utils/entities";

export function handleNewGauge(event: NewGauge): void {
  let gauge = getGauge(Bytes.fromByteArray(crypto.keccak256(event.params.addr)));
  gauge.exists = true;
  gauge.type = event.params.gauge_type;
  gauge.save();
}

export function handleVoteForGauge(event: VoteForGauge): void {
  let vote = getVote(getGauge(Bytes.fromByteArray(crypto.keccak256(event.params.gauge_addr))), getUser(event.params.user));

  vote.timestamp = event.params.time;
  vote.weight = event.params.weight;

  vote.save();

}