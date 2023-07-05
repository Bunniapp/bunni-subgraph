import { Address, BigDecimal, BigInt, Bytes } from "@graphprotocol/graph-ts";

import { Bounty, Bribe, Bunni, BunniToken, Gauge, Pool, Quest, Token, User, UserPosition, Vote, VotingLock } from "../types/schema";
import { BunniHub } from "../types/BunniHub/BunniHub";
import { UniswapV3Pool } from "../types/templates";

import { BUNNI_HUB } from "./constants";
import { fetchPoolFee, fetchPoolSqrtPriceX96, fetchPoolTick, fetchPoolToken0, fetchPoolToken1 } from "./pool";
import { sqrtPriceX96ToTokenPrices } from "./price";
import { fetchTokenDecimals, fetchTokenName, fetchTokenSymbol } from "./token";
import { convertToDecimals } from "./math";

export function getBounty(bountyID: BigInt): Bounty {
  let bounty = Bounty.load(bountyID.toHex());

  if (bounty === null) {
    bounty = new Bounty(bountyID.toHex());

    bounty.rewardAmount = BigDecimal.zero();
    bounty.rewardPerPeriod = BigDecimal.zero();
    bounty.maxRewardPerVote = BigDecimal.zero();
    
    bounty.numberOfPeriods = BigInt.zero();
    bounty.startPeriod = BigInt.zero();
    bounty.endPeriod = BigInt.zero();

    bounty.gauge = Address.zero();
    bounty.rewardToken = Address.zero();

    bounty.save();
  }

  return bounty as Bounty;
}

export function getBribe(bribeIdentifier: Bytes, bribeIndex: i32): Bribe {
  let bribe = Bribe.load(bribeIdentifier.toHex() + '-' + bribeIndex.toString());

  if (bribe == null) {
    bribe = new Bribe(bribeIdentifier.toHex() + '-' + bribeIndex.toString());

    bribe.proposal = Address.zero();
    bribe.bribeIdentifier = bribeIdentifier;
    bribe.rewardIdentifier = Address.zero();

    bribe.token = Address.zero();
    bribe.amount = BigDecimal.zero();
    bribe.deadline = BigInt.zero();
    bribe.briber = Address.zero();

    bribe.save();
  }

  return bribe as Bribe;
}

export function getBunni(): Bunni {
  let bunni = Bunni.load(BUNNI_HUB);
  let hubContract = BunniHub.bind(BUNNI_HUB);

  if (bunni === null) {
    bunni = new Bunni(BUNNI_HUB);

    let protocolFeeResult = hubContract.try_protocolFee();
    if (!protocolFeeResult.reverted) {
      bunni.protocolFee = convertToDecimals(protocolFeeResult.value, BigInt.fromI32(18));
    }
    bunni.inflationRate = BigDecimal.zero();

    bunni.optionsMultiplier = BigDecimal.zero();
    bunni.optionsOracle = Address.zero();
    bunni.optionsTreasury = Address.zero();
    bunni.wethRedeemed = BigDecimal.zero();

    bunni.save();
  }

  return bunni as Bunni;
}

export function getBunniToken(bunniKey: Bytes): BunniToken {
  let bunniToken = BunniToken.load(bunniKey);

  if (bunniToken === null) {
    bunniToken = new BunniToken(bunniKey);

    bunniToken.address = Address.zero();
    bunniToken.decimals = BigInt.zero();
    bunniToken.name = '';
    bunniToken.symbol = '';
    bunniToken.totalSupply = BigDecimal.zero();

    bunniToken.liquidity = BigInt.zero();
    bunniToken.tickLower = BigInt.zero();
    bunniToken.tickUpper = BigInt.zero();

    bunniToken.amount0PerShare = BigDecimal.zero();
    bunniToken.amount1PerShare = BigDecimal.zero();
    bunniToken.liquidityPerShare = BigDecimal.zero();
    bunniToken.reserve0 = BigDecimal.zero();
    bunniToken.reserve1 = BigDecimal.zero();

    bunniToken.token0Volume = BigDecimal.zero();
    bunniToken.token1Volume = BigDecimal.zero();
    bunniToken.token0CollectedFees = BigDecimal.zero();
    bunniToken.token1CollectedFees = BigDecimal.zero();

    bunniToken.pool = Address.zero();

    bunniToken.save();
  }

  return bunniToken as BunniToken;
}

export function getGauge(gaugeIdentifier: Bytes): Gauge {
  let gauge = Gauge.load(gaugeIdentifier);

  if (gauge === null) {
    gauge = new Gauge(gaugeIdentifier);

    gauge.address = Address.zero();
    gauge.chain = BigInt.zero();
    gauge.decimals = BigInt.zero();
    gauge.name = '';
    gauge.symbol = '';
    gauge.totalSupply = BigDecimal.zero();

    gauge.exists = false;
    gauge.relativeWeightCap = BigDecimal.zero();
    gauge.tokenlessProduction = BigInt.zero();
    gauge.type = BigInt.zero();
    gauge.workingSupply = BigDecimal.zero();

    gauge.bunniToken = Address.zero();
    gauge.rewardTokens = [];
    gauge.bribes = [];

    gauge.save();
  }

  return gauge as Gauge;
}

export function getPool(poolAddress: Address): Pool {
  let pool = Pool.load(poolAddress);

  if (pool === null) {
    pool = new Pool(poolAddress);

    pool.address = poolAddress;
    pool.liquidity = BigInt.zero();
    pool.fee = fetchPoolFee(poolAddress);
    pool.sqrtPriceX96 = fetchPoolSqrtPriceX96(poolAddress);
    pool.tick = fetchPoolTick(poolAddress);

    pool.token0 = fetchPoolToken0(poolAddress);
    pool.token1 = fetchPoolToken1(poolAddress);
    pool.token0Price = sqrtPriceX96ToTokenPrices(pool.sqrtPriceX96)[0];
    pool.token1Price = sqrtPriceX96ToTokenPrices(pool.sqrtPriceX96)[1];

    pool.reserve0 = BigDecimal.zero();
    pool.reserve1 = BigDecimal.zero();

    pool.token0Volume = BigDecimal.zero();
    pool.token1Volume = BigDecimal.zero();
    pool.token0CollectedFees = BigDecimal.zero();
    pool.token1CollectedFees = BigDecimal.zero();

    pool.bunniTokens = [];

    pool.save();
    UniswapV3Pool.create(poolAddress);
  }

  return pool as Pool;
}

export function getQuest(questID: BigInt): Quest {
  let quest = Quest.load(questID.toHex());

  if (quest == null) {
    quest = new Quest(questID.toHex());

    quest.startPeriod = BigInt.zero();
    quest.duration = BigInt.zero();
    quest.deadline = BigInt.zero();
    quest.objectiveVotes = BigDecimal.zero();
    quest.rewardPerVote = BigDecimal.zero();
    quest.creator = Address.zero();

    quest.gauge = Address.zero();
    quest.rewardToken = Address.zero();

    quest.save();
  }

  return quest as Quest;
}

export function getToken(tokenAddress: Address): Token {
  let token = Token.load(tokenAddress);

  if (token === null) {
    token = new Token(tokenAddress);

    token.address = tokenAddress;
    token.decimals = fetchTokenDecimals(tokenAddress);
    token.name = fetchTokenName(tokenAddress);
    token.symbol = fetchTokenSymbol(tokenAddress);

    token.save();
  }

  return token as Token;
}

export function getUser(userAddress: Address): User {
  let user = User.load(userAddress);

  if (user === null) {
    user = new User(userAddress);

    user.address = userAddress;

    user.save();
  }

  return user as User;
}

export function getUserPosition(bunniToken: BunniToken, user: User): UserPosition {
  let userPosition = UserPosition.load(bunniToken.address.toHex() + '-' + user.address.toHex());

  if (userPosition === null) {
    userPosition = new UserPosition(bunniToken.address.toHex() + '-' + user.address.toHex());

    userPosition.user = user.id;
    userPosition.balance = BigDecimal.zero();
    userPosition.gaugeBalance = BigDecimal.zero();
    userPosition.workingBalance = BigDecimal.zero();

    userPosition.token0CostBasisPerShare = BigDecimal.zero();
    userPosition.token1CostBasisPerShare = BigDecimal.zero();

    userPosition.bunniToken = bunniToken.id;

    userPosition.save();
  }

  return userPosition as UserPosition;
}

export function getVote(gauge: Gauge, user: User): Vote {
  let vote = Vote.load(gauge.address.toHex() + '-' + user.address.toHex());

  if (vote === null) {
    vote = new Vote(gauge.address.toHex() + '-' + user.address.toHex());

    vote.power = BigDecimal.zero();
    vote.decay = BigDecimal.zero();
    vote.timestamp = BigInt.zero();
    vote.weight = BigInt.zero();

    vote.gauge = gauge.id;
    vote.user = user.id;

    vote.save();
  }

  return vote as Vote;
}

export function getVotingLock(user: User): VotingLock {
  let lock = VotingLock.load(user.address);

  if (lock === null) {
    lock = new VotingLock(user.address);

    lock.amount = BigDecimal.zero();
    lock.balance = BigDecimal.zero();
    lock.decay = BigDecimal.zero();
    lock.lastUpdate = BigInt.zero();
    lock.lockEnd = BigInt.zero();

    lock.user = user.id;

    lock.save();
  }

  return lock as VotingLock;
}