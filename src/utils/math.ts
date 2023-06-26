import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";

export function convertToDecimals(i: BigInt, decimals: BigInt = BigInt.fromI32(18)): BigDecimal {
  return i.toBigDecimal().div(new BigDecimal(tenPow(decimals.toI32())));
}

export function tenPow(exponent: number): BigInt {
  let result = BigInt.fromI32(1);
  for (let i = 0; i < exponent; ++i) {
    result = result.times(BigInt.fromI32(10));
  }
  return result;
}