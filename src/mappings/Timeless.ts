import { Address } from "@graphprotocol/graph-ts";
import { DeployYieldTokenPair } from "../types/GateFactory/GateFactory";
import { Gate } from "../types/GateFactory/Gate";
import { PoolCreated } from "../types/UniswapV3Factory/UniswapV3Factory";
import { DeployXPYT } from "../types/xPYTFactory/xPYTFactory"
import { DeployXPYT as DeployUniswapV3xPYT } from "../types/UniswapV3xPYTFactory/UniswapV3xPYTFactory"
import { xPYT as xPYT_template, Pound } from "../types/templates/xPYT/xPYT"
import { xPYT } from "../types/schema";

import { getPool, getToken, getVault, getXpyt } from "../utils/entities";
import { convertToDecimals, tenPow } from "../utils/math";

export function handleDeployYieldTokenPair(event: DeployYieldTokenPair): void {
  let vault = getVault(event.params.vault);

  let gateContract = Gate.bind(event.params.gate);
  let underlyingCall = gateContract.try_getUnderlyingOfVault(event.params.vault);
  if (!underlyingCall.reverted) {
    vault.underlying = getToken(underlyingCall.value).id;
  }

  vault.gate = event.params.gate;
  vault.share = getToken(event.params.vault).id;
  vault.nyt = getToken(event.params.nyt).id;
  vault.pyt = getToken(event.params.pyt).id;

  vault.save();
}

export function handlePoolCreated(event: PoolCreated): void {
  let xpyt0 = xPYT.load(event.params.token0);
  if (xpyt0 !== null) {
    let vault = getVault(Address.fromBytes(xpyt0.vault));
    if (Address.fromBytes(vault.nyt) == event.params.token1) {
      let pool = getPool(event.params.pool);
      let pools = xpyt0.pools;
      pools.push(pool.id);
      xpyt0.pools = pools;
      xpyt0.save();
    }
  }

  let xpyt1 = xPYT.load(event.params.token1);
  if (xpyt1 !== null) {
    let vault = getVault(Address.fromBytes(xpyt1.vault));
    if (Address.fromBytes(vault.nyt) == event.params.token0) {
      let pool = getPool(event.params.pool);
      let pools = xpyt1.pools;
      pools.push(pool.id);
      xpyt1.pools = pools;
      xpyt1.save();
    }
  }
}

export function handleDeployXPYT(event: DeployXPYT): void {
  let xpyt = getXpyt(event.params.deployed);

  /// update the xPYT array on the Vault entity
  let xpytContract = xPYT_template.bind(event.params.deployed);
  let vaultAddress = xpytContract.try_vault();
  if (!vaultAddress.reverted) {
    let vault = getVault(vaultAddress.value);
    let xpytArray = vault.xpyt;
    xpytArray.push(xpyt.id);
    vault.xpyt = xpytArray;
    vault.save();

    xpyt.vault = vault.id;
  }

  xpyt.save();
}

export function handleDeployUniswapV3xPYT(event: DeployUniswapV3xPYT): void {
  let xpyt = getXpyt(event.params.deployed);
  let pool = getPool(event.params.pool);

  /// update the Pool array on the xPYT entity
  let pools = xpyt.pools;
  pools.push(pool.id);
  xpyt.pools = pools;

  /// update the xPYT array on the Vault entity
  let xpytContract = xPYT_template.bind(event.params.deployed);
  let vaultAddress = xpytContract.try_vault();
  if (!vaultAddress.reverted) {
    let vault = getVault(vaultAddress.value);
    let xpytArray = vault.xpyt;
    xpytArray.push(xpyt.id);
    vault.xpyt = xpytArray;
    vault.save();

    xpyt.vault = vault.id;
  }

  xpyt.save();
  pool.save();
}

export function handlePound(event: Pound): void {
  let xpyt = getXpyt(event.address);
  let xpytContract = xPYT_template.bind(event.address);

  let xpytConversionRateCall = xpytContract.try_convertToShares(tenPow(xpyt.decimals.toI32()));
  if (!xpytConversionRateCall.reverted) {
    xpyt.conversionRate = convertToDecimals(xpytConversionRateCall.value, xpyt.decimals);
  }

  xpyt.save();
}