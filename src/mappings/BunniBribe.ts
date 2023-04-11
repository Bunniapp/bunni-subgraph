import { BunniBribe, DepositBribe } from "../../generated/BunniBribe/BunniBribe";
import { getGauge, getBribe } from "../utils/entities";

export function handleDepositBribe(event: DepositBribe): void {
    let bribeContract = BunniBribe.bind(event.address);

    let gauge = getGauge(event.params.proposal);
    let bribe = getBribe(event.params.bribeIdentifier);

    bribe.gauge = gauge.id;
    bribe.proposal = event.params.proposal;
    bribe.bribeIdentifier = event.params.bribeIdentifier;
    bribe.rewardIdentifier = event.params.rewardIdentifier;

    bribe.token = event.params.token;
    bribe.amount = event.params.amount;
    bribe.deadline = bribeContract.proposalDeadlines(event.params.proposal);
    bribe.briber = event.params.briber;

    bribe.save();
}