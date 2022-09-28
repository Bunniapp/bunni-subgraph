import { Address, BigInt } from "@graphprotocol/graph-ts";
import { BunniToken, Pool } from "../../generated/schema";
import { UniswapV3Pool } from "../../generated/templates";
import { ZERO_BD, ZERO_INT, ZERO_ADDR } from "./constants";

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

    bunniToken.save();
  }

  return bunniToken as BunniToken;
}

export function getPool(address: Address): Pool {
  let pool = Pool.load(address.toHex());

  if (pool === null) {
    UniswapV3Pool.create(address);
    pool = new Pool(address.toHex());

    pool.fee = ZERO_INT;
    pool.tick = ZERO_INT;
    pool.address = address;
    pool.liquidity = ZERO_INT;

    pool.token0 = ZERO_ADDR;
    pool.token1 = ZERO_ADDR;
    pool.token0Price = ZERO_BD;
    pool.token1Price = ZERO_BD;

    pool.save();
  }

  return pool as Pool;
}
