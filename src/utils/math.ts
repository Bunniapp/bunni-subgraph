import { BigInt, BigDecimal } from "@graphprotocol/graph-ts";
import { ZERO_BD, ONE_BD } from './constants';

export function tenPow(exponent: number): BigInt {
  let result = BigInt.fromI32(1);
  for (let i = 0; i < exponent; i++) {
    result = result.times(BigInt.fromI32(10));
  }
  return result;
}

export function normalize(i: BigInt, decimals: number = 18): BigDecimal {
  return i.toBigDecimal().div(new BigDecimal(tenPow(decimals)));
}

export function safeDiv(amount0: BigDecimal, amount1: BigDecimal): BigDecimal {
  if (amount1.equals(ZERO_BD)) {
    return ZERO_BD;
  } else {
    return amount0.div(amount1);
  }
}

let Q192 = BigInt.fromI32(2).pow(192);
export function sqrtPriceX96ToTokenPrices(sqrtPriceX96: BigInt): BigDecimal[] {
  let num = sqrtPriceX96.times(sqrtPriceX96).toBigDecimal();
  let denom = BigDecimal.fromString(Q192.toString());
  let price1 = num.div(denom);
  let price0 = safeDiv(ONE_BD, price1);
  return [price0, price1];
}
