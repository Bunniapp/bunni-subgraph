import { Bytes, crypto } from "@graphprotocol/graph-ts";
import { NewQuest } from "../../generated/QuestBoard/QuestBoard";
import { WEEK } from "../utils/constants";
import { getQuest } from "../utils/entities";


export function handleNewQuest(event: NewQuest): void {
    let quest = getQuest(event.params.questID);

    quest.gauge = Bytes.fromByteArray(crypto.keccak256(event.params.gauge));
    quest.rewardToken = event.params.rewardToken;
    quest.startPeriod = event.params.startPeriod;
    quest.deadline = event.params.startPeriod.plus(event.params.duration.times(WEEK));
    quest.duration = event.params.duration;
    quest.objectiveVotes = event.params.objectiveVotes;
    quest.rewardPerVote = event.params.rewardPerVote;
    quest.creator = event.params.creator;

    quest.save();
}