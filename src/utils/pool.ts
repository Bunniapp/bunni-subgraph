import { Address, BigInt } from "@graphprotocol/graph-ts";
import { UniswapV3Pool } from "../types/templates/UniswapV3Pool/UniswapV3Pool";
import { getToken } from "./entities";

export function fetchPoolFee(poolAddress: Address): BigInt {
  let contract = UniswapV3Pool.bind(poolAddress);

  let feeValue = BigInt.zero();
  let feeResult = contract.try_fee();

  if (feeResult.reverted) {
    // @dev handle revert scenario
  } else {
    feeValue = BigInt.fromI32(feeResult.value);
  }

  return feeValue;
}

export function fetchPoolSqrtPriceX96(poolAddress: Address): BigInt {
  let contract = UniswapV3Pool.bind(poolAddress);

  let sqrtValue = BigInt.zero();
  let slot0 = contract.try_slot0();
  
  if (slot0.reverted) {
    // @dev handle revert scenario
  } else {
    sqrtValue = slot0.value.value0;
  }

  return sqrtValue;
}

export function fetchPoolTick(poolAddress: Address): BigInt {
  let contract = UniswapV3Pool.bind(poolAddress);

  let tickValue = BigInt.zero();
  let slot0 = contract.try_slot0();
  
  if (slot0.reverted) {
    // @dev handle revert scenario
  } else {
    tickValue = BigInt.fromI32(slot0.value.value1);
  }

  return tickValue;
}

export function fetchPoolToken0(poolAddress: Address): Address {
  let contract = UniswapV3Pool.bind(poolAddress);

  let token0Value = Address.zero();
  let token0Result = contract.try_token0();

  if (token0Result.reverted) {
    // @dev handle revert scenario
  } else {
    token0Value = token0Result.value;
    getToken(token0Value);
  }

  return token0Value;
}

export function fetchPoolToken1(poolAddress: Address): Address {
  let contract = UniswapV3Pool.bind(poolAddress);

  let token1Value = Address.zero();
  let token1Result = contract.try_token1();

  if (token1Result.reverted) {
    // @dev handle revert scenario
  } else {
    token1Value = token1Result.value;
    getToken(token1Value);
  }

  return token1Value;
}