import { GaugeCreated } from "../../generated/LiquidityGaugeFactory/LiquidityGaugeFactory";
import { LiquidityGauge } from "../../generated/LiquidityGaugeFactory/LiquidityGauge";
import { getBunniToken, getGauge } from "../utils/entities";

export function handleGaugeCreated(event: GaugeCreated): void {
  let gauge = getGauge(event.params.gauge);
  let liquidityGauge = LiquidityGauge.bind(event.params.gauge);
  let lpToken = liquidityGauge.lp_token();

  let bunniToken = getBunniToken(lpToken);
  bunniToken.gauge = event.params.gauge;
  bunniToken.save();

  gauge.bunniToken = lpToken;
  gauge.save();
}