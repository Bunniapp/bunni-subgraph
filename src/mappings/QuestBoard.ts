import { Address, BigInt, Bytes, crypto } from "@graphprotocol/graph-ts";
import { IncreasedQuestDuration, IncreasedQuestObjective, IncreasedQuestReward, NewQuest } from "../types/QuestBoard/QuestBoard";

import { WEEK } from "../utils/constants";
import { getQuest, getToken } from "../utils/entities";
import { convertToDecimals } from "../utils/math";

export function handleIncreasedQuestDuration(event: IncreasedQuestDuration): void {
  let quest = getQuest(event.params.questID);
  quest.deadline = quest.deadline.plus(event.params.addedDuration.times(WEEK));
  quest.duration = quest.duration.plus(event.params.addedDuration);
  quest.save();
}

export function handleIncreasedQuestObjective(event: IncreasedQuestObjective): void {
  let quest = getQuest(event.params.questID);
  quest.objectiveVotes = convertToDecimals(event.params.newObjective, BigInt.fromI32(18));
  quest.save();
}

export function handleIncreasedQuestReward(event: IncreasedQuestReward): void {
  let quest = getQuest(event.params.questID);
  let token = getToken(Address.fromBytes(quest.rewardToken));

  quest.rewardPerVote = convertToDecimals(event.params.newRewardPerVote, token.decimals);
  quest.save();
}

export function handleNewQuest(event: NewQuest): void {
  let quest = getQuest(event.params.questID);
  let token = getToken(event.params.rewardToken);

  quest.startPeriod = event.params.startPeriod;
  quest.deadline = event.params.startPeriod.plus(event.params.duration.times(WEEK));
  quest.duration = event.params.duration;
  quest.objectiveVotes = convertToDecimals(event.params.objectiveVotes, BigInt.fromI32(18));
  quest.rewardPerVote = convertToDecimals(event.params.rewardPerVote, token.decimals);
  quest.creator = event.params.creator;

  quest.gauge = Bytes.fromByteArray(crypto.keccak256(event.params.gauge));
  quest.rewardToken = token.id;

  quest.save();
}