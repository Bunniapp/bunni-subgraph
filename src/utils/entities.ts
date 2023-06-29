import { Address, BigDecimal, BigInt, Bytes } from "@graphprotocol/graph-ts";

import { BunniToken, Gauge, Pool, Token, User, UserPosition, Vote, VotingLock } from "../types/schema";
import { UniswapV3Pool } from "../types/templates";

import { fetchPoolFee, fetchPoolSqrtPriceX96, fetchPoolTick, fetchPoolToken0, fetchPoolToken1 } from "./pool";
import { sqrtPriceX96ToTokenPrices } from "./price";
import { fetchTokenDecimals, fetchTokenName, fetchTokenSymbol } from "./token";

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