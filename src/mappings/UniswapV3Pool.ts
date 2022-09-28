import { BigInt } from "@graphprotocol/graph-ts";
import { Initialize, Mint, Burn, Swap } from "../../generated/templates/UniswapV3Pool/UniswapV3Pool";
import { getPool } from "../utils/entities";
import { sqrtPriceX96ToTokenPrices } from "../utils/math";

export function handleInitialize(event: Initialize): void {
  let pool = getPool(event.address);
  let prices = sqrtPriceX96ToTokenPrices(event.params.sqrtPriceX96);

  pool.tick = BigInt.fromI32(event.params.tick);
  pool.token0Price = prices[0];
  pool.token1Price = prices[1];

  pool.save();
}

export function handleMint(event: Mint): void {
  let pool = getPool(event.address);

  // Update liquidity if the position being minted includes the current tick
  if (BigInt.fromI32(event.params.tickLower).le(pool.tick) && BigInt.fromI32(event.params.tickUpper).gt(pool.tick)) {
    pool.liquidity = pool.liquidity.plus(event.params.amount);
  }

  pool.save();
}

export function handleBurn(event: Burn): void {
  let pool = getPool(event.address);

  // Update liquidity if the position being burned includes the current tick
  if (BigInt.fromI32(event.params.tickLower).le(pool.tick) && BigInt.fromI32(event.params.tickUpper).gt(pool.tick)) {
    pool.liquidity = pool.liquidity.minus(event.params.amount);
  }

  pool.save();
}

export function handleSwap(event: Swap): void {
  let pool = getPool(event.address);
  let prices = sqrtPriceX96ToTokenPrices(event.params.sqrtPriceX96);

  pool.tick = BigInt.fromI32(event.params.tick);
  pool.liquidity = event.params.liquidity;
  pool.token0Price = prices[0];
  pool.token1Price = prices[1];

  pool.save();
}
