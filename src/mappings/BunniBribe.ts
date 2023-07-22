import { BigInt } from "@graphprotocol/graph-ts";
import { BunniBribe, DepositBribe } from "../types/BunniBribe/BunniBribe";
import { BribeVault, DepositBribe as DepositBribeV2 } from "../types/BribeVault/BribeVault";
import { BribeMarket } from "../types/BribeVault/BribeMarket";

import { BRIBE_MARKET, WEEK } from "../utils/constants";
import { getGauge, getBribe, getToken } from "../utils/entities";
import { convertToDecimals } from "../utils/math";

export function handleDepositBribe(event: DepositBribe): void {
    let bribeContract = BunniBribe.bind(event.address);

    let gauge = getGauge(event.params.proposal);
    let bribe = getBribe(event.params.bribeIdentifier, gauge.bribes.length);
    let token = getToken(event.params.token);

    bribe.version = BigInt.fromI32(1);
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

export function handleDepositBribeV2(event: DepositBribeV2): void {
  /// only care about BUNNI market
  if (event.params.market == BRIBE_MARKET) {
    let vaultContract = BribeVault.bind(event.address);
    let marketContract = BribeMarket.bind(event.params.market);

    let deadline = marketContract.proposalDeadlines(event.params.proposal);
    let bribeIdentifier = vaultContract.generateBribeVaultIdentifier(BRIBE_MARKET, event.params.proposal, deadline, event.params.token);
    let rewardIdentifier = vaultContract.generateRewardIdentifier(BRIBE_MARKET, event.params.token, deadline);

    let gauge = getGauge(event.params.proposal);
    let bribe = getBribe(bribeIdentifier, gauge.bribes.length);
    let token = getToken(event.params.token);

    bribe.version = BigInt.fromI32(2);
    bribe.proposal = event.params.proposal;
    bribe.bribeIdentifier = bribeIdentifier;
    bribe.rewardIdentifier = rewardIdentifier;

    bribe.token = token.id;
    bribe.amount = convertToDecimals(event.params.amount, token.decimals);
    bribe.maxTokensPerVote = convertToDecimals(event.params.maxTokensPerVote, token.decimals);
    bribe.deadline = event.block.timestamp.div(WEEK).times(WEEK).plus(event.params.periodIndex.times(WEEK)).plus(WEEK);
    bribe.briber = event.params.briber;

    bribe.save();

    let bribes = gauge.bribes;
    bribes.push(bribe.id);
    gauge.bribes = bribes;
    gauge.save();
  }

  


}