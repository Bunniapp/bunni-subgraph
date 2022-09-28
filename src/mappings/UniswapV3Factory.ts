import { BigInt } from "@graphprotocol/graph-ts";
import { PoolCreated } from "../../generated/UniswapV3Factory/UniswapV3Factory";
import { getPool } from "../utils/entities";

export function handlePoolCreated(event: PoolCreated): void {
  let pool = getPool(event.params.pool);
  pool.fee = BigInt.fromI32(event.params.fee);
  pool.token0 = event.params.token0;
  pool.token1 = event.params.token1;
  pool.save();
}
