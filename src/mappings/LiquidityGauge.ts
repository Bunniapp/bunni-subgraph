import { Address, BigDecimal, BigInt, dataSource } from "@graphprotocol/graph-ts";
import { 
  Deposit,
  Withdraw,
  UpdateLiquidityLimit,
  Transfer,
  // Approval,
  RewardDistributorUpdated,
  RelativeWeightCapChanged,
  // NewPendingAdmin,
  // NewAdmin,
  NewTokenlessProduction
} from "../types/templates/LiquidityGauge/LiquidityGauge";
import { getBunniToken, getGauge, getToken, getUser, getUserPosition } from "../utils/entities";
import { convertToDecimals } from "../utils/math";

export function handleDeposit(event: Deposit): void {
  let gauge = getGauge(dataSource.context().getBytes("id"));
  let userPosition = getUserPosition(getBunniToken(gauge.bunniToken), getUser(event.params.provider));

  /// update the gauge total supply
  let amount = convertToDecimals(event.params.value, gauge.decimals);
  gauge.totalSupply = gauge.totalSupply.plus(amount);

  /// update the user position gauge balance
  userPosition.gaugeBalance = userPosition.gaugeBalance.plus(amount);

  gauge.save();
  userPosition.save();
}

export function handleWithdraw(event: Withdraw): void {
  let gauge = getGauge(dataSource.context().getBytes("id"));
  let userPosition = getUserPosition(getBunniToken(gauge.bunniToken), getUser(event.params.provider));

  /// update the gauge total supply
  let amount = convertToDecimals(event.params.value, gauge.decimals);
  gauge.totalSupply = gauge.totalSupply.minus(amount);

  /// update the user position gauge balance
  userPosition.gaugeBalance = userPosition.gaugeBalance.minus(amount);
  
  gauge.save();
  userPosition.save();
}

export function handleUpdateLiquidityLimit(event: UpdateLiquidityLimit): void {
  let gauge = getGauge(dataSource.context().getBytes("id"));
  let userPosition = getUserPosition(getBunniToken(gauge.bunniToken), getUser(event.params.user));

  /// update the gauge working supply
  gauge.workingSupply = convertToDecimals(event.params.working_supply, gauge.decimals);

  /// update the user position working balance
  userPosition.workingBalance = convertToDecimals(event.params.working_balance, gauge.decimals);

  gauge.save();
  userPosition.save();
}

export function handleTransfer(event: Transfer): void {
  /// ignore minting and burning events
  if (event.params._from !== Address.zero() && event.params._to !== Address.zero()) {
    let gauge = getGauge(dataSource.context().getBytes("id"));
    let fromPosition = getUserPosition(getBunniToken(gauge.bunniToken), getUser(event.params._from));
    let toPosition = getUserPosition(getBunniToken(gauge.bunniToken), getUser(event.params._to));
    let amount = convertToDecimals(event.params._value, gauge.decimals);

    /// update sender user position
    fromPosition.gaugeBalance = fromPosition.gaugeBalance.minus(amount);

    /// update recipient user position, accounting for the cost basis of the amount transferred
    let toOldTotalBalance = toPosition.balance.plus(toPosition.gaugeBalance);
    let toNewTotalBalance = toPosition.balance.plus(toPosition.gaugeBalance).plus(amount);

    let token0CostBasis = toPosition.token0CostBasisPerShare.times(toOldTotalBalance).plus(fromPosition.token0CostBasisPerShare.times(amount));
    let token1CostBasis = toPosition.token1CostBasisPerShare.times(toOldTotalBalance).plus(fromPosition.token1CostBasisPerShare.times(amount));
    if (toNewTotalBalance.gt(BigDecimal.zero())) {
      toPosition.token0CostBasisPerShare = token0CostBasis.div(toNewTotalBalance);
      toPosition.token1CostBasisPerShare = token1CostBasis.div(toNewTotalBalance);
    }
    toPosition.balance = toPosition.balance.plus(amount);

    fromPosition.save();
    toPosition.save();
  }
}

// export function handleApproval(event: Approval): void {}

export function handleRewardDistributorUpdated(event: RewardDistributorUpdated): void {
  let gauge = getGauge(dataSource.context().getBytes("id"));
  let token = getToken(event.params.reward_token);

  let rewardTokens = gauge.rewardTokens;
  if (!rewardTokens.includes(token.id)) {
    rewardTokens.push(token.id);
    gauge.rewardTokens = rewardTokens;
  }

  gauge.save();
  token.save();
}

export function handleRelativeWeightCapChanged(event: RelativeWeightCapChanged): void {
  let gauge = getGauge(dataSource.context().getBytes("id"));
  gauge.relativeWeightCap = convertToDecimals(event.params.new_relative_weight_cap, BigInt.fromI32(18));
  gauge.save();
}

// export function handleNewPendingAdmin(event: NewPendingAdmin): void {}

// export function handleNewAdmin(event: NewAdmin): void {}

export function handleNewTokenlessProduction(event: NewTokenlessProduction): void {
  let gauge = getGauge(dataSource.context().getBytes("id"));
  gauge.tokenlessProduction = BigInt.fromI32(event.params.new_tokenless_production);
  gauge.save();
}