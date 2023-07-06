import { Address, BigInt, Bytes, crypto } from "@graphprotocol/graph-ts";
import { VoteMarket, BountyCreated, BountyDurationIncrease, PeriodRolledOver } from "../types/VoteMarket/VoteMarket";
import { getBounty, getToken } from "../utils/entities";
import { convertToDecimals } from "../utils/math";
import { WEEK } from "../utils/constants";

export function handleBountyCreated(event: BountyCreated): void {
  let bounty = getBounty(event.params.id);
  let token = getToken(event.params.rewardToken);
  let platformContract = VoteMarket.bind(event.address);

  bounty.rewardAmount = convertToDecimals(event.params.totalRewardAmount, token.decimals);
  bounty.rewardPerPeriod = convertToDecimals(event.params.rewardPerPeriod, token.decimals);
  bounty.maxRewardPerVote = convertToDecimals(event.params.maxRewardPerVote, token.decimals);

  bounty.numberOfPeriods = BigInt.fromI32(event.params.numberOfPeriods);

  let currentPeriodResult = platformContract.try_getCurrentPeriod();
  if (!currentPeriodResult.reverted) {
    bounty.startPeriod = currentPeriodResult.value;
    bounty.endPeriod = bounty.startPeriod.plus(bounty.numberOfPeriods.times(WEEK));
  }

  bounty.gauge = Bytes.fromByteArray(crypto.keccak256(event.params.gauge));
  bounty.rewardToken = token.id;

  bounty.save();
}

export function handleBountyDurationIncrease(event: BountyDurationIncrease): void {
  let bounty = getBounty(event.params.id);
  let token = getToken(Address.fromBytes(bounty.rewardToken));

  bounty.rewardAmount = convertToDecimals(event.params.totalRewardAmount, token.decimals);
  bounty.maxRewardPerVote = convertToDecimals(event.params.maxRewardPerVote, token.decimals);

  bounty.numberOfPeriods = BigInt.fromI32(event.params.numberOfPeriods);
  bounty.endPeriod = bounty.startPeriod.plus(bounty.numberOfPeriods.times(WEEK));

  bounty.save();
}

export function handlePeriodRolledOver(event: PeriodRolledOver): void {
  let bounty = getBounty(event.params.id);
  let token = getToken(Address.fromBytes(bounty.rewardToken));

  bounty.rewardPerPeriod = convertToDecimals(event.params.rewardPerPeriod, token.decimals);

  bounty.save();
}