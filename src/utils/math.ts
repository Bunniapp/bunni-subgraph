import { BigInt } from "@graphprotocol/graph-ts";

export function tenPow(exponent: number): BigInt {
  let result = BigInt.fromI32(1);
  for (let i = 0; i < exponent; i++) {
    result = result.times(BigInt.fromI32(10));
  }
  return result;
}
