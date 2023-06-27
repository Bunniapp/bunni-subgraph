import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { BunniLens, BunniLens__pricePerFullShareInputKeyStruct, BunniLens__getReservesInputKeyStruct } from "../types/templates/UniswapV3Pool/BunniLens";
import { BUNNI_LENS } from "./constants";

export function fetchPricePerFullShare(pool: Bytes, tickLower: BigInt, tickUpper: BigInt): BigInt[] {
  let key = new BunniLens__pricePerFullShareInputKeyStruct();
  key.push(ethereum.Value.fromAddress(Address.fromBytes(pool)));
  key.push(ethereum.Value.fromSignedBigInt(tickLower));
  key.push(ethereum.Value.fromSignedBigInt(tickUpper));

  let bunniLens = BunniLens.bind(BUNNI_LENS);
  let pricePerFullShareResult = bunniLens.try_pricePerFullShare(key);

  let liquidity = BigInt.zero();
  let amount0 = BigInt.zero();
  let amount1 = BigInt.zero();

  if (!pricePerFullShareResult.reverted) {
    liquidity = pricePerFullShareResult.value.value0;
    amount0 = pricePerFullShareResult.value.value1;
    amount1 = pricePerFullShareResult.value.value2;
  }

  return [liquidity, amount0, amount1];
}

export function fetchReserves(pool: Bytes, tickLower: BigInt, tickUpper: BigInt): BigInt[] {
  let key = new BunniLens__getReservesInputKeyStruct();
  key.push(ethereum.Value.fromAddress(Address.fromBytes(pool)));
  key.push(ethereum.Value.fromSignedBigInt(tickLower));
  key.push(ethereum.Value.fromSignedBigInt(tickUpper));

  let bunniLens = BunniLens.bind(BUNNI_LENS);
  let reserveResult = bunniLens.try_getReserves(key);

  let reserve0 = BigInt.zero();
  let reserve1 = BigInt.zero();

  if (!reserveResult.reverted) {
    reserve0 = reserveResult.value.value0;
    reserve1 = reserveResult.value.value1;
  }

  return [reserve0, reserve1];
}

