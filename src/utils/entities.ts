import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";
import { Bunni, BunniToken, Gauge, Vote, Bribe, Quest, Pool } from "../../generated/schema";
import { BunniHub } from "../../generated/BunniHub/BunniHub";
import { UniswapV3Pool as UniswapPool } from "../../generated/BunniHub/UniswapV3Pool";
import { UniswapV3Pool } from "../../generated/templates";
import { BUNNI_HUB, ZERO_INT, ZERO_ADDR } from "./constants";
import { sqrtPriceX96ToTokenPrices } from "./math";

export function getBunni(): Bunni {
  let bunni = Bunni.load(BUNNI_HUB);

  if (bunni === null) {
    let bunniHubContract = BunniHub.bind(BUNNI_HUB);

    bunni = new Bunni(BUNNI_HUB);
    bunni.protocolFee = bunniHubContract.protocolFee();
    bunni.save();
  }

  return bunni as Bunni;
}

export function getBunniToken(bunniKey: Bytes): BunniToken {
  let bunniToken = BunniToken.load(bunniKey);

  if (bunniToken === null) {
    bunniToken = new BunniToken(bunniKey);

    bunniToken.name = '';
    bunniToken.symbol = '';
    bunniToken.address = ZERO_ADDR;
    bunniToken.decimals = ZERO_INT;
    bunniToken.precision = ZERO_INT;

    bunniToken.pool = ZERO_ADDR;
    bunniToken.tickLower = ZERO_INT;
    bunniToken.tickUpper = ZERO_INT;
    bunniToken.liquidity = ZERO_INT;

    bunniToken.bunniKey = bunniKey;
    bunniToken.positionKey = ZERO_ADDR;

    bunniToken.collectedFeesToken0 = ZERO_INT;
    bunniToken.collectedFeesToken1 = ZERO_INT;

    bunniToken.totalVolumeToken0 = ZERO_INT;
    bunniToken.totalVolumeToken1 = ZERO_INT;

    bunniToken.save();
  }

  return bunniToken as BunniToken;
}

export function getGauge(gaugeIdentifier: Bytes): Gauge {
  let gauge = Gauge.load(gaugeIdentifier);

  if (gauge === null) {
    gauge = new Gauge(gaugeIdentifier);

    gauge.address = ZERO_ADDR;
    gauge.bunniToken = ZERO_ADDR;
    gauge.bribes = new Array<string>();

    gauge.save();
  }

  return gauge as Gauge;
}

export function getVote(voteIdentifier: Bytes): Vote {
  let vote = Vote.load(voteIdentifier);

  if (vote === null) {
    vote = new Vote(voteIdentifier);
    
    vote.gauge = ZERO_ADDR;
    vote.power = ZERO_INT;
    vote.decay = ZERO_INT;
    vote.timestamp = ZERO_INT;
    vote.voter = ZERO_ADDR;
    vote.weight = ZERO_INT;

    vote.save();
  }

  return vote as Vote;
}

export function getBribe(bribeIdentifier: Bytes, bribeIndex: i32): Bribe {
  let bribe = Bribe.load(bribeIdentifier.toHex() + '-' + bribeIndex.toString());

  if (bribe == null) {
    bribe = new Bribe(bribeIdentifier.toHex() + '-' + bribeIndex.toString());

    bribe.proposal = ZERO_ADDR;
    bribe.bribeIdentifier = bribeIdentifier;
    bribe.rewardIdentifier = ZERO_ADDR;

    bribe.token = ZERO_ADDR;
    bribe.amount = ZERO_INT;
    bribe.deadline = ZERO_INT;
    bribe.briber = ZERO_ADDR;

    bribe.save();
  }

  return bribe as Bribe;
}

export function getQuest(questID: BigInt): Quest {
  let quest = Quest.load(questID.toHex());

  if (quest == null) {
    quest = new Quest(questID.toHex());

    quest.gauge = ZERO_ADDR;
    quest.rewardToken = ZERO_ADDR;
    quest.startPeriod = ZERO_INT;
    quest.duration = ZERO_INT;
    quest.deadline = ZERO_INT;
    quest.objectiveVotes = ZERO_INT;
    quest.rewardPerVote = ZERO_INT;
    quest.creator = ZERO_ADDR;

    quest.save();
  }

  return quest as Quest;
}

export function getPool(address: Address): Pool {
  let pool = Pool.load(address);

  if (pool === null) {
    let poolContract = UniswapPool.bind(address);
    let slot0 = poolContract.slot0();
    let price = sqrtPriceX96ToTokenPrices(slot0.value0);

    pool = new Pool(address);

    pool.fee = BigInt.fromI32(poolContract.fee());
    pool.tick = BigInt.fromI32(slot0.value1);
    pool.address = address;
    pool.liquidity = ZERO_INT;
    pool.sqrtPriceX96 = slot0.value0;

    pool.token0 = poolContract.token0();
    pool.token1 = poolContract.token1();
    pool.token0Price = price[0];
    pool.token1Price = price[1];

    pool.totalValueLockedToken0 = ZERO_INT;
    pool.totalValueLockedToken1 = ZERO_INT;
    pool.totalVolumeToken0 = ZERO_INT;
    pool.totalVolumeToken1 = ZERO_INT;
    pool.totalFeesToken0 = ZERO_INT;
    pool.totalFeesToken1 = ZERO_INT;

    pool.bunniTokens = new Array<Bytes>();

    pool.save();
    UniswapV3Pool.create(address);
  }

  return pool as Pool;
}
