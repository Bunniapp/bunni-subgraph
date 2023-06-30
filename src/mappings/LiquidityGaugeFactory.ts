import { Bytes, DataSourceContext, crypto, dataSource } from "@graphprotocol/graph-ts";
import { BunniToken } from "../types/LiquidityGaugeFactory/BunniToken";
import { LiquidityGauge } from "../types/LiquidityGaugeFactory/LiquidityGauge";
import { ChildGauge } from "../types/ChildGaugeFactory/ChildGauge";
import { GaugeCreated } from "../types/LiquidityGaugeFactory/LiquidityGaugeFactory";
import { DeployedGauge as DeployedChildGauge } from "../types/ChildGaugeFactory/ChildGaugeFactory";
import { DeployedGauge as DeployedRootGauge } from "../types/RootGaugeFactory/RootGaugeFactory";
import { LiquidityGauge as LiquidityGaugeTemplate, ChildGauge as ChildGaugeTemplate, RootGauge as RootGaugeTemplate } from "../types/templates";

import { CHAIN_ID } from "../utils/constants";
import { getBunniToken, getGauge } from "../utils/entities";
import { bunniKey } from "../utils/helpers";
import { fetchTokenDecimals, fetchTokenName, fetchTokenSymbol } from "../utils/token";

export function handleGaugeCreated(event: GaugeCreated): void {
  let gaugeContract = LiquidityGauge.bind(event.params.gauge);
  let bunniTokenContract = BunniToken.bind(gaugeContract.lp_token());

  let bunniToken = getBunniToken(bunniKey(bunniTokenContract.pool(), bunniTokenContract.tickLower(), bunniTokenContract.tickUpper()));
  let gauge = getGauge(Bytes.fromByteArray(crypto.keccak256(event.params.gauge)));

  gauge.address = event.params.gauge;
  gauge.decimals = fetchTokenDecimals(event.params.gauge);
  gauge.name = fetchTokenName(event.params.gauge);
  gauge.symbol = fetchTokenSymbol(event.params.gauge);

  gauge.bunniToken = bunniToken.id;

  let chain = CHAIN_ID.get(dataSource.network());
  if (chain !== null) gauge.chain = chain;

  bunniToken.gauge = gauge.id;

  bunniToken.save();
  gauge.save();

  let liquidityGaugeContext = new DataSourceContext();
  liquidityGaugeContext.setBytes("id", gauge.id);
  LiquidityGaugeTemplate.createWithContext(event.params.gauge, liquidityGaugeContext);
}

export function handleDeployedChildGauge(event: DeployedChildGauge): void {
  let gaugeContract = ChildGauge.bind(event.params._gauge);
  let bunniTokenContract = BunniToken.bind(gaugeContract.lp_token());

  let bunniToken = getBunniToken(bunniKey(bunniTokenContract.pool(), bunniTokenContract.tickLower(), bunniTokenContract.tickUpper()));
  let gauge = getGauge(Bytes.fromByteArray(crypto.keccak256(event.params._gauge)));

  gauge.address = event.params._gauge;
  gauge.decimals = fetchTokenDecimals(event.params._gauge);
  gauge.name = fetchTokenName(event.params._gauge);
  gauge.symbol = fetchTokenSymbol(event.params._gauge);

  gauge.bunniToken = bunniToken.id;

  let chain = CHAIN_ID.get(dataSource.network());
  if (chain !== null) gauge.chain = chain;

  bunniToken.gauge = gauge.id;

  bunniToken.save();
  gauge.save();

  let childGaugeContext = new DataSourceContext();
  childGaugeContext.setBytes("id", gauge.id);
  ChildGaugeTemplate.createWithContext(event.params._gauge, childGaugeContext);
}

export function handleDeployedRootGauge(event: DeployedRootGauge): void {
  let gauge = getGauge(Bytes.fromByteArray(crypto.keccak256(event.params._gauge)));
  gauge.chain = event.params._chain_id;
  gauge.address = event.params._gauge;
  // leave the gauge.bunniToken as ZERO_ADDRESS for root gauges (this is how we know it's a root gauge)
  gauge.save();
  
  let rootGaugeContext = new DataSourceContext();
  rootGaugeContext.setBytes("id", gauge.id);
  RootGaugeTemplate.createWithContext(event.params._gauge, rootGaugeContext);
}