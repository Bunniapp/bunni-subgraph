import { Address, BigInt } from "@graphprotocol/graph-ts";
import { ERC20 } from "../../generated/BunniHub/ERC20";
import { BunniToken } from "../../generated/schema";
import { Mint, Burn, Swap } from "../../generated/templates/UniswapV3Pool/UniswapV3Pool";
import { getPool } from "../utils/entities";
import { sqrtPriceX96ToTokenPrices } from "../utils/math";

export function handleMint(event: Mint): void {
  let pool = getPool(event.address);
  let token0Contract = ERC20.bind(Address.fromBytes(pool.token0));
  let token1Contract = ERC20.bind(Address.fromBytes(pool.token1));

  pool.totalValueLockedToken0 = token0Contract.balanceOf(event.address);
  pool.totalValueLockedToken1 = token1Contract.balanceOf(event.address);

  if (BigInt.fromI32(event.params.tickLower).le(pool.tick) && BigInt.fromI32(event.params.tickUpper).gt(pool.tick)) {
    pool.liquidity = pool.liquidity.plus(event.params.amount);
  }

  pool.save();
}

export function handleBurn(event: Burn): void {
  let pool = getPool(event.address);
  let token0Contract = ERC20.bind(Address.fromBytes(pool.token0));
  let token1Contract = ERC20.bind(Address.fromBytes(pool.token1));
  pool.totalValueLockedToken0 = token0Contract.balanceOf(event.address);
  pool.totalValueLockedToken1 = token1Contract.balanceOf(event.address);

  // Update liquidity if the position being burned includes the current tick
  if (BigInt.fromI32(event.params.tickLower).le(pool.tick) && BigInt.fromI32(event.params.tickUpper).gt(pool.tick)) {
    pool.liquidity = pool.liquidity.minus(event.params.amount);
  }

  pool.save();
}

export function handleSwap(event: Swap): void {
  let pool = getPool(event.address);
  let prices = sqrtPriceX96ToTokenPrices(event.params.sqrtPriceX96);
  let amount0 = event.params.amount0;
  let amount1 = event.params.amount1;
  let fee0 = amount0.times(pool.fee).div(BigInt.fromI32(1000000));
  let fee1 = amount1.times(pool.fee).div(BigInt.fromI32(1000000));
  let token0Contract = ERC20.bind(Address.fromBytes(pool.token0));
  let token1Contract = ERC20.bind(Address.fromBytes(pool.token1));

  pool.totalValueLockedToken0 = token0Contract.balanceOf(event.address);
  pool.totalValueLockedToken1 = token1Contract.balanceOf(event.address);

  pool.totalVolumeToken0 = pool.totalVolumeToken0.plus(amount0.abs());
  pool.totalVolumeToken1 = pool.totalVolumeToken1.plus(amount1.abs());
  
  pool.totalFeesToken0 = pool.totalFeesToken0.plus(fee0.abs());
  pool.totalFeesToken1 = pool.totalFeesToken1.plus(fee1.abs());

  pool.tick = BigInt.fromI32(event.params.tick);
  pool.liquidity = event.params.liquidity;
  pool.sqrtPriceX96 = event.params.sqrtPriceX96;
  pool.token0Price = prices[0];
  pool.token1Price = prices[1];

  pool.save();

  // update relevant BunniToken volume data
  for (let i = 0; i < pool.bunniTokens.length; i++) {
    let bunniToken = BunniToken.load(pool.bunniTokens[i])!;
    if (event.params.tick < bunniToken.tickUpper.toI32() && event.params.tick >= bunniToken.tickLower.toI32() && bunniToken.liquidity.gt(BigInt.zero())) {
      // volume touches BunniToken's position
      let adjustedVolumeToken0 = amount0.abs().times(bunniToken.liquidity).div(event.params.liquidity);
      let adjustedVolumeToken1 = amount1.abs().times(bunniToken.liquidity).div(event.params.liquidity);
      bunniToken.totalVolumeToken0 = bunniToken.totalVolumeToken0.plus(adjustedVolumeToken0);
      bunniToken.totalVolumeToken1 = bunniToken.totalVolumeToken1.plus(adjustedVolumeToken1);
      bunniToken.save();
    }
  }
}