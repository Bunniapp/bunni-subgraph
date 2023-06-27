import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Mint, Burn, Swap } from "../types/templates/UniswapV3Pool/UniswapV3Pool";

import { getBunniToken, getPool, getToken } from "../utils/entities";
import { fetchPricePerFullShare, fetchReserves } from "../utils/lens";
import { convertToDecimals } from "../utils/math";
import { sqrtPriceX96ToTokenPrices } from "../utils/price";

export function handleMint(event: Mint): void {
  let pool = getPool(event.address);

  /// update pool liquidity
  if (BigInt.fromI32(event.params.tickLower).le(pool.tick) && BigInt.fromI32(event.params.tickUpper).gt(pool.tick)) {
    pool.liquidity = pool.liquidity.plus(event.params.amount);
  }
  pool.save();
}

export function handleBurn(event: Burn): void {
  let pool = getPool(event.address);

  /// update pool liquidity
  if (BigInt.fromI32(event.params.tickLower).le(pool.tick) && BigInt.fromI32(event.params.tickUpper).gt(pool.tick)) {
    pool.liquidity = pool.liquidity.minus(event.params.amount);
  }

  pool.save();
}

export function handleSwap(event: Swap): void {
  let pool = getPool(event.address);

  let token0 = getToken(Address.fromBytes(pool.token0));
  let token1 = getToken(Address.fromBytes(pool.token1));

  /// update pool liquidity, tick and prices
  pool.liquidity = event.params.liquidity;
  pool.sqrtPriceX96 = event.params.sqrtPriceX96;
  pool.tick = BigInt.fromI32(event.params.tick);
  pool.token0Price = sqrtPriceX96ToTokenPrices(event.params.sqrtPriceX96)[0];
  pool.token1Price = sqrtPriceX96ToTokenPrices(event.params.sqrtPriceX96)[1];

  /// update bunni token(s) data
  for(let i = 0; i < pool.bunniTokens.length; ++i) {
    let bunniToken = getBunniToken(pool.bunniTokens[i]);
    
    /// update the bunni token reserve and shares
    if (bunniToken.totalSupply.gt(BigDecimal.zero())) {
      /// reset pool aggregates until new amounts calculated
      pool.reserve0 = pool.reserve0.minus(bunniToken.reserve0);
      pool.reserve1 = pool.reserve1.minus(bunniToken.reserve1);

      /// update the position reserves
      let reserves: BigInt[] = fetchReserves(pool.address, bunniToken.tickLower, bunniToken.tickUpper);
      bunniToken.reserve0 = convertToDecimals(reserves[0], token0.decimals);
      bunniToken.reserve1 = convertToDecimals(reserves[1], token1.decimals);

      /// update the position shares
      let pricePerFullShare: BigInt[] = fetchPricePerFullShare(pool.address, bunniToken.tickLower, bunniToken.tickUpper);
      bunniToken.amount0PerShare = convertToDecimals(pricePerFullShare[1], token0.decimals);
      bunniToken.amount1PerShare = convertToDecimals(pricePerFullShare[2], token1.decimals);

      /// update the pool aggregates with new amounts
      pool.reserve0 = pool.reserve0.plus(bunniToken.reserve0);
      pool.reserve1 = pool.reserve1.plus(bunniToken.reserve1);
    }

    /// update the bunni token volume
    if (bunniToken.liquidity.gt(BigInt.zero()) && pool.tick.lt(bunniToken.tickUpper) && pool.tick.ge(bunniToken.tickLower)) {
      /// reset pool aggregates until new amounts calculated
      pool.token0Volume = pool.token0Volume.minus(bunniToken.token0Volume);
      pool.token1Volume = pool.token1Volume.minus(bunniToken.token1Volume);

      let adjustedVolumeToken0 = event.params.amount0.abs().times(bunniToken.liquidity).div(event.params.liquidity);
      let adjustedVolumeToken1 = event.params.amount0.abs().times(bunniToken.liquidity).div(event.params.liquidity);
      bunniToken.token0Volume = bunniToken.token0Volume.plus(convertToDecimals(adjustedVolumeToken0, token0.decimals));
      bunniToken.token1Volume = bunniToken.token1Volume.plus(convertToDecimals(adjustedVolumeToken1, token1.decimals));

      /// update the pool aggregates with new amounts
      pool.token0Volume = pool.token0Volume.plus(bunniToken.token0Volume);
      pool.token1Volume = pool.token1Volume.plus(bunniToken.token1Volume);
    }

    bunniToken.save();
  }

  pool.save();
}