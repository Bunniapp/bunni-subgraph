import { BunniBribe, DepositBribe } from "../types/BunniBribe/BunniBribe";
import { getGauge, getBribe, getToken } from "../utils/entities";
import { convertToDecimals } from "../utils/math";

export function handleDepositBribe(event: DepositBribe): void {
    let bribeContract = BunniBribe.bind(event.address);

    let gauge = getGauge(event.params.proposal);
    let bribe = getBribe(event.params.bribeIdentifier, gauge.bribes.length);
    let token = getToken(event.params.token);

    bribe.proposal = event.params.proposal;
    bribe.bribeIdentifier = event.params.bribeIdentifier;
    bribe.rewardIdentifier = event.params.rewardIdentifier;

    bribe.token = token.id;
    bribe.amount = convertToDecimals(event.params.amount, token.decimals);
    bribe.deadline = bribeContract.proposalDeadlines(event.params.proposal);
    bribe.briber = event.params.briber;

    bribe.save();

    let bribes = gauge.bribes;
    bribes.push(bribe.id);
    gauge.bribes = bribes;
    gauge.save();
}