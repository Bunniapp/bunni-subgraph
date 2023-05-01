import { Bytes, crypto } from "@graphprotocol/graph-ts";
import { GaugeCreated } from "../../generated/LiquidityGaugeFactory/LiquidityGaugeFactory";
import { LiquidityGauge } from "../../generated/LiquidityGaugeFactory/LiquidityGauge";
import { DeployedGauge } from "../../generated/ChildGaugeFactory/ChildGaugeFactory";
import { ChildGauge } from "../../generated/ChildGaugeFactory/ChildGauge";
import { BunniToken } from "../../generated/LiquidityGaugeFactory/BunniToken";
import { getGauge } from "../utils/entities";
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
}

export function handleDeployedGauge(event: DeployedGauge): void {
  let childGauge = ChildGauge.bind(event.params._gauge);
  let lpToken = childGauge.lp_token();

  let bunniTokenContract = BunniToken.bind(lpToken);
  let pool = bunniTokenContract.pool();
  let tickLower = bunniTokenContract.tickLower();
  let tickUpper = bunniTokenContract.tickUpper();

  let gauge = getGauge(Bytes.fromByteArray(crypto.keccak256(event.params._gauge)));
  gauge.address = event.params._gauge;
  gauge.bunniToken = bunniKey(pool, tickLower, tickUpper);
  gauge.save();
}