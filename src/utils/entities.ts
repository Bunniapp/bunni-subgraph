import { Address, BigInt } from "@graphprotocol/graph-ts";
import { BunniToken, Pool } from "../../generated/schema";
import { UniswapV3Pool as UniswapPool } from "../../generated/BunniHub/UniswapV3Pool";
import { UniswapV3Pool, ERC20 } from "../../generated/templates";
import { ZERO_BD, ZERO_INT, ZERO_ADDR } from "./constants";
import { sqrtPriceX96ToTokenPrices } from "./math";

export function getBunniToken(address: Address): BunniToken {
  let bunniToken = BunniToken.load(address.toHex());

  if (bunniToken === null) {
    bunniToken = new BunniToken(address.toHex());

    bunniToken.name = '';
    bunniToken.symbol = '';
    bunniToken.address = address;
    bunniToken.decimals = ZERO_INT;
    bunniToken.precision = ZERO_INT;

    bunniToken.pool = ZERO_ADDR.toHex();
    bunniToken.tickLower = ZERO_INT;
    bunniToken.tickUpper = ZERO_INT;
    bunniToken.totalSupply = ZERO_BD;

    bunniToken.save();
    ERC20.create(address);
  }

  return bunniToken as BunniToken;
}

export function getPool(address: Address): Pool {
  let pool = Pool.load(address.toHex());

  if (pool === null) {
    let poolContract = UniswapPool.bind(address);
    let slot0 = poolContract.slot0();
    let price = sqrtPriceX96ToTokenPrices(slot0.value0);

    pool = new Pool(address.toHex());

    pool.fee = BigInt.fromI32(poolContract.fee());
    pool.tick = BigInt.fromI32(slot0.value1);
    pool.address = address;
    pool.liquidity = ZERO_INT;

    pool.token0 = poolContract.token0();
    pool.token1 = poolContract.token1();
    pool.token0Price = price[0];
    pool.token1Price = price[1];

    pool.save();
    UniswapV3Pool.create(address);
  }

  return pool as Pool;
}
