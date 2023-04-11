import { Bytes, crypto } from "@graphprotocol/graph-ts";
import { GaugeCreated } from "../../generated/LiquidityGaugeFactory/LiquidityGaugeFactory";
import { LiquidityGauge } from "../../generated/LiquidityGaugeFactory/LiquidityGauge";
import { BunniToken } from "../../generated/LiquidityGaugeFactory/BunniToken";
import { getBunniToken, getGauge } from "../utils/entities";
import { bunniKey } from "../utils/helpers";

export function handleGaugeCreated(event: GaugeCreated): void {
  let liquidityGauge = LiquidityGauge.bind(event.params.gauge);
  let lpToken = liquidityGauge.lp_token();

  let bunniTokenContract = BunniToken.bind(lpToken);
  let pool = bunniTokenContract.pool();
  let tickLower = bunniTokenContract.tickLower();
  let tickUpper = bunniTokenContract.tickUpper();

  let gauge = getGauge(Bytes.fromByteArray(crypto.keccak256(event.params.gauge)));
  gauge.address = event.params.gauge;
  gauge.bunniToken = bunniKey(pool, tickLower, tickUpper);
  gauge.save();

  let bunniToken = getBunniToken(gauge.bunniToken);
  bunniToken.gauge = event.params.gauge;
  bunniToken.save();
}