import { Bytes, DataSourceContext, crypto, dataSource } from "@graphprotocol/graph-ts";
import { BunniToken } from "../types/LiquidityGaugeFactory/BunniToken";
import { LiquidityGauge } from "../types/LiquidityGaugeFactory/LiquidityGauge";
import { GaugeCreated } from "../types/LiquidityGaugeFactory/LiquidityGaugeFactory";
import { LiquidityGauge as LiquidityGaugeTemplate } from "../types/templates";

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