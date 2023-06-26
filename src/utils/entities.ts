import { Address, BigDecimal, BigInt, Bytes } from "@graphprotocol/graph-ts";

import { BunniToken, Pool, Token } from "../types/schema";
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

    bunniToken.token0Reserve = BigDecimal.zero();
    bunniToken.token1Reserve = BigDecimal.zero();
    bunniToken.token0Share = BigDecimal.zero();
    bunniToken.token1Share = BigDecimal.zero();

    bunniToken.pool = Address.zero();

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

    pool.token0 = fetchPoolToken0(poolAddress);
    pool.token1 = fetchPoolToken1(poolAddress);
    pool.token0Price = sqrtPriceX96ToTokenPrices(pool.sqrtPriceX96)[0];
    pool.token1Price = sqrtPriceX96ToTokenPrices(pool.sqrtPriceX96)[1];

    pool.token0Reserve = BigDecimal.zero();
    pool.token1Reserve = BigDecimal.zero();

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