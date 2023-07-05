import { Address, BigDecimal, BigInt, dataSource } from "@graphprotocol/graph-ts";
import { AddReward, Deposit, Withdraw, UpdateLiquidityLimit, Transfer, NewTokenlessProduction, SetRewardDistributor } from "../types/templates/ChildGauge/ChildGauge";
import { getBunniToken, getGauge, getRewardToken, getToken, getUser, getUserPosition } from "../utils/entities";
import { convertToDecimals } from "../utils/math";

export function handleAddReward(event: AddReward): void {
  let gauge = getGauge(dataSource.context().getBytes("id"));
  let token = getToken(event.params.reward_token);
  let rewardToken = getRewardToken(gauge, token);
  rewardToken.save();
}

export function handleDeposit(event: Deposit): void {
  let gauge = getGauge(dataSource.context().getBytes("id"));
  let userPosition = getUserPosition(getBunniToken(gauge.bunniToken), getUser(event.params._user));

  /// update the gauge total supply
  let amount = convertToDecimals(event.params._value, gauge.decimals);
  gauge.totalSupply = gauge.totalSupply.plus(amount);

  /// update the user position gauge balance
  userPosition.gaugeBalance = userPosition.gaugeBalance.plus(amount);

  gauge.save();
}

export function handleWithdraw(event: Withdraw): void {
  let gauge = getGauge(dataSource.context().getBytes("id"));
  let userPosition = getUserPosition(getBunniToken(gauge.bunniToken), getUser(event.params._user));

  /// update the gauge total supply
  let amount = convertToDecimals(event.params._value, gauge.decimals);
  gauge.totalSupply = gauge.totalSupply.minus(amount);

  /// update the user position gauge balance
  userPosition.gaugeBalance = userPosition.gaugeBalance.minus(amount);

  gauge.save();
}

export function handleUpdateLiquidityLimit(event: UpdateLiquidityLimit): void {
  let gauge = getGauge(dataSource.context().getBytes("id"));
  let userPosition = getUserPosition(getBunniToken(gauge.bunniToken), getUser(event.params._user));

  /// update the gauge working supply
  gauge.workingSupply = convertToDecimals(event.params._working_supply, gauge.decimals);

  /// update the user position working balance
  userPosition.workingBalance = convertToDecimals(event.params._working_balance, gauge.decimals);

  gauge.save();
  userPosition.save();
}

export function handleTransfer(event: Transfer): void {
  /// ignore minting and burning events
  if (event.params._from != Address.zero() && event.params._to != Address.zero()) {
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
    toPosition.gaugeBalance = toPosition.gaugeBalance.plus(amount);

    fromPosition.save();
    toPosition.save();
  }
}

export function handleNewTokenlessProduction(event: NewTokenlessProduction): void {
  let gauge = getGauge(dataSource.context().getBytes("id"));
  gauge.tokenlessProduction = BigInt.fromI32(event.params.new_tokenless_production);
  gauge.save();
}

export function handleSetRewardDistributor(event: SetRewardDistributor): void {
  let gauge = getGauge(dataSource.context().getBytes("id"));
  let token = getToken(event.params.reward_token);
  let rewardToken = getRewardToken(gauge, token);

  rewardToken.distributor = event.params.distributor;
  rewardToken.save();
}