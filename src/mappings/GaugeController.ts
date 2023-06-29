import { BigDecimal, Bytes, crypto } from "@graphprotocol/graph-ts";
import { NewGauge, VoteForGauge } from "../types/GaugeController/GaugeController";
import { getGauge, getUser, getVote, getVotingLock } from "../utils/entities";

export function handleNewGauge(event: NewGauge): void {
  let gauge = getGauge(Bytes.fromByteArray(crypto.keccak256(event.params.addr)));
  gauge.exists = true;
  gauge.type = event.params.gauge_type;
  gauge.save();
}

export function handleVoteForGauge(event: VoteForGauge): void {
  let vote = getVote(getGauge(Bytes.fromByteArray(crypto.keccak256(event.params.gauge_addr))), getUser(event.params.user));
  let lock = getVotingLock(getUser(event.params.user));

  let decayTime = event.params.time.minus(lock.lastUpdate);
  let decayAmount = lock.decay.times(decayTime.toBigDecimal());
  let adjustedPower = lock.balance.minus(decayAmount);
  let timeLeft = lock.lockEnd.minus(event.params.time);

  vote.power = adjustedPower.times(event.params.weight.toBigDecimal()).div(BigDecimal.fromString("10000"));
  vote.decay = adjustedPower.times(event.params.weight.toBigDecimal()).div(BigDecimal.fromString("10000")).div(timeLeft.toBigDecimal());
  vote.timestamp = event.params.time;
  vote.weight = event.params.weight;

  vote.save();

}