import { Bytes, crypto, dataSource } from "@graphprotocol/graph-ts";
import { GaugeCreated } from "../../generated/LiquidityGaugeFactory/LiquidityGaugeFactory";
import { LiquidityGauge } from "../../generated/LiquidityGaugeFactory/LiquidityGauge";
import { DeployedGauge as DeployedRootGauge } from "../../generated/RootGaugeFactory/RootGaugeFactory";
import { DeployedGauge as DeployedChildGauge } from "../../generated/ChildGaugeFactory/ChildGaugeFactory";
import { ChildGauge } from "../../generated/ChildGaugeFactory/ChildGauge";
import { BunniToken } from "../../generated/LiquidityGaugeFactory/BunniToken";
import { CHAIN_ID } from "../utils/constants";
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

  let chain = CHAIN_ID.get(dataSource.network());
  if (chain !== null) gauge.chain = chain;

  gauge.save();
}

export function handleDeployedChildGauge(event: DeployedChildGauge): void {
  let childGauge = ChildGauge.bind(event.params._gauge);
  let lpToken = childGauge.lp_token();

  let bunniTokenContract = BunniToken.bind(lpToken);
  let pool = bunniTokenContract.pool();
  let tickLower = bunniTokenContract.tickLower();
  let tickUpper = bunniTokenContract.tickUpper();

  let gauge = getGauge(Bytes.fromByteArray(crypto.keccak256(event.params._gauge)));
  gauge.address = event.params._gauge;
  gauge.bunniToken = bunniKey(pool, tickLower, tickUpper);

  let chain = CHAIN_ID.get(dataSource.network());
  if (chain !== null) gauge.chain = chain;

  gauge.save();
}

export function handleDeployedRootGauge(event: DeployedRootGauge): void {
  let gauge = getGauge(Bytes.fromByteArray(crypto.keccak256(event.params._gauge)));
  gauge.chain = event.params._chain_id;
  gauge.address = event.params._gauge;
  // leave the gauge.bunniToken as ZERO_ADDRESS for root gauges (this is how we know it's a root gauge)
  gauge.save();
}