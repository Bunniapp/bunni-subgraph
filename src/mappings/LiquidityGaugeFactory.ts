import { BigInt, Bytes, DataSourceContext, crypto, dataSource } from "@graphprotocol/graph-ts";
import { BunniToken } from "../types/LiquidityGaugeFactory/BunniToken";
import { LiquidityGauge } from "../types/LiquidityGaugeFactory/LiquidityGauge";
import { ChildGauge } from "../types/ChildGaugeFactory/ChildGauge";
import { GaugeCreated } from "../types/LiquidityGaugeFactory/LiquidityGaugeFactory";
import { DeployedGauge as DeployedChildGauge, Minted } from "../types/ChildGaugeFactory/ChildGaugeFactory";
import { DeployedGauge as DeployedRootGauge } from "../types/RootGaugeFactory/RootGaugeFactory";
import { LiquidityGauge as LiquidityGaugeTemplate, ChildGauge as ChildGaugeTemplate, RootGauge as RootGaugeTemplate } from "../types/templates";

import { CHAIN_ID } from "../utils/constants";
import { getBunniToken, getGauge, getUser, getUserPosition } from "../utils/entities";
import { bunniKey } from "../utils/helpers";
import { fetchTokenDecimals, fetchTokenName, fetchTokenSymbol } from "../utils/token";
import { convertToDecimals } from "../utils/math";

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

export function handleMinted(event: Minted): void {
  let gauge = getGauge(Bytes.fromByteArray(crypto.keccak256(event.params._gauge)));
  let bunniToken = getBunniToken(gauge.bunniToken);

  let user = getUser(event.params._user);
  let userPosition = getUserPosition(bunniToken, user);

  /// reset aggregates until new amounts calculated
  let oldAmount = userPosition.claimedRewards;
  user.claimedRewards = user.claimedRewards.minus(oldAmount);
  gauge.claimedRewards = gauge.claimedRewards.minus(oldAmount);

  /// update with new amounts
  let newAmount = convertToDecimals(event.params._new_total, BigInt.fromI32(18));
  gauge.claimedRewards = gauge.claimedRewards.plus(newAmount);
  user.claimedRewards = user.claimedRewards.plus(newAmount);
  userPosition.claimedRewards = newAmount;

  gauge.save();
  user.save();
  userPosition.save();
}