import { Address, BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { Mint, Burn, Swap } from "../types/templates/UniswapV3Pool/UniswapV3Pool";
import { BunniLens, BunniLens__getReservesInputKeyStruct } from "../types/templates/UniswapV3Pool/BunniLens";

import { BUNNI_LENS } from "../utils/constants";
import { getBunniToken, getPool, getToken } from "../utils/entities";
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
  let bunniLens = BunniLens.bind(BUNNI_LENS);

  for(let i = 0; i < pool.bunniTokens.length; ++i) {
    let bunniToken = getBunniToken(pool.bunniTokens[i]);
    
    if (bunniToken.totalSupply.gt(BigDecimal.zero())) {
      /// generate the key struct
      let key = new BunniLens__getReservesInputKeyStruct();
      key.push(ethereum.Value.fromAddress(Address.fromBytes(pool.address)));
      key.push(ethereum.Value.fromSignedBigInt(bunniToken.tickLower));
      key.push(ethereum.Value.fromSignedBigInt(bunniToken.tickUpper));

      let reserveResult = bunniLens.try_getReserves(key);

      if (!reserveResult.reverted) {
        /// reset pool aggregates until new amounts calculated
        pool.token0Reserve = pool.token0Reserve.minus(bunniToken.token0Reserve);
        pool.token1Reserve = pool.token1Reserve.minus(bunniToken.token1Reserve);

        /// update the position reserves
        bunniToken.token0Reserve = convertToDecimals(reserveResult.value.value0, token0.decimals);
        bunniToken.token1Reserve = convertToDecimals(reserveResult.value.value1, token1.decimals);
        bunniToken.token0Share = bunniToken.token0Reserve.div(bunniToken.totalSupply);
        bunniToken.token1Share = bunniToken.token1Reserve.div(bunniToken.totalSupply);

        /// update the pool aggregates with new amounts
        pool.token0Reserve = pool.token0Reserve.plus(bunniToken.token0Reserve);
        pool.token1Reserve = pool.token1Reserve.plus(bunniToken.token1Reserve);
      }
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