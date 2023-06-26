import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { safeDiv } from "./math";

export function sqrtPriceX96ToTokenPrices(sqrtPriceX96: BigInt): BigDecimal[] {
  let Q192 = BigInt.fromI32(2).pow(192);
  let num = sqrtPriceX96.times(sqrtPriceX96).toBigDecimal();
  let denom = BigDecimal.fromString(Q192.toString());
  let price1 = num.div(denom);
  let price0 = safeDiv(BigDecimal.fromString("1"), price1);
  return [price0, price1];
}