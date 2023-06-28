import { BigInt, dataSource } from "@graphprotocol/graph-ts";
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
import { getGauge, getToken } from "../utils/entities";
import { convertToDecimals } from "../utils/math";

export function handleDeposit(event: Deposit): void {
  let gauge = getGauge(dataSource.context().getBytes("id"));

  let amount = convertToDecimals(event.params.value, gauge.decimals);
  gauge.totalSupply = gauge.totalSupply.plus(amount);

  gauge.save();
}

export function handleWithdraw(event: Withdraw): void {
  let gauge = getGauge(dataSource.context().getBytes("id"));

  let amount = convertToDecimals(event.params.value, gauge.decimals);
  gauge.totalSupply = gauge.totalSupply.minus(amount);
  
  gauge.save();
}

export function handleUpdateLiquidityLimit(event: UpdateLiquidityLimit): void {
  let gauge = getGauge(dataSource.context().getBytes("id"));
  gauge.workingSupply = convertToDecimals(event.params.working_supply, gauge.decimals);
  gauge.save();
}

export function handleTransfer(event: Transfer): void {}

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