import { BigInt, Bytes, crypto } from "@graphprotocol/graph-ts";
import { GaugeController, VoteForGauge } from "../../generated/GaugeController/GaugeController";
import { VotingEscrow } from "../../generated/GaugeController/VotingEscrow";
import { getVote } from "../utils/entities";

export function handleVoteForGauge(event: VoteForGauge): void {
    let gaugeController = GaugeController.bind(event.address);
    let votingEscrow = VotingEscrow.bind(gaugeController.voting_escrow());

    let totalUserPower = votingEscrow.balanceOf(event.params.user);
    let userLock = votingEscrow.locked(event.params.user);
    let timeLeft = userLock.end.minus(event.block.timestamp);

    let gaugeHash = crypto.keccak256(event.params.gauge_addr);
    let voterHash = crypto.keccak256(event.params.user);
    let voteIdentifier = Bytes.fromByteArray(crypto.keccak256(gaugeHash.concat(voterHash)));

    let vote = getVote(voteIdentifier);

    vote.gauge = Bytes.fromByteArray(crypto.keccak256(event.params.gauge_addr));
    vote.power = totalUserPower.times(event.params.weight).div(BigInt.fromI32(10000));
    vote.decay = totalUserPower.times(event.params.weight).div(BigInt.fromI32(10000)).div(timeLeft);
    vote.timestamp = event.params.time;
    vote.voter = event.params.user;
    vote.weight = event.params.weight;

    vote.save();
}