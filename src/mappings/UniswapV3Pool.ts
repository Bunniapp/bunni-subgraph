import { BigInt } from "@graphprotocol/graph-ts";
import { UniswapV3Pool as UniswapPool } from "../../generated/BunniHub/UniswapV3Pool";
import { Mint, Burn, Swap } from "../../generated/templates/UniswapV3Pool/UniswapV3Pool";
import { NEG_ONE_INT } from "../utils/constants";
import { getPool } from "../utils/entities";
import { sqrtPriceX96ToTokenPrices } from "../utils/math";

export function handleMint(event: Mint): void {
  let pool = getPool(event.address);

  if (pool.liquidity.equals(NEG_ONE_INT)) {
    // Pool was just initialized, contract call will include the minted liquidity
    let poolContract = UniswapPool.bind(event.address);
    pool.liquidity = poolContract.liquidity();
  } else {
    // Update liquidity if the position being minted includes the current tick
    if (BigInt.fromI32(event.params.tickLower).le(pool.tick) && BigInt.fromI32(event.params.tickUpper).gt(pool.tick)) {
      pool.liquidity = pool.liquidity.plus(event.params.amount);
    }
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
