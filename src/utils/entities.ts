import { Address, BigDecimal, BigInt, Bytes } from "@graphprotocol/graph-ts";

import { BunniToken, Pool, Token } from "../types/schema";
import { UniswapV3Pool } from "../types/templates";

import { fetchPoolFee, fetchPoolSqrtPriceX96, fetchPoolTick } from "./pool";
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

    bunniToken.save();
  }

  return bunniToken as BunniToken;
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