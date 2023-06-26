import { Address, BigInt } from '@graphprotocol/graph-ts';
import { ERC20 } from '../types/BunniHub/ERC20'

export function fetchTokenDecimals(tokenAddress: Address): BigInt {
  let contract = ERC20.bind(tokenAddress);

  let decimalsValue = 0;
  let decimalsResult = contract.try_decimals();
  
  if (decimalsResult.reverted) {
    /// @dev handle revert scenario with static token definition file
  } else {
    decimalsValue = decimalsResult.value;
  }

  return BigInt.fromI32(decimalsValue as i32);
}

export function fetchTokenName(tokenAddress: Address): string {
  let contract = ERC20.bind(tokenAddress);

  let nameValue = 'unknown';
  let nameResult = contract.try_name();
  
  if (nameResult.reverted) {
    /// @dev handle revert scenario with static token definition file
  } else {
    nameValue = nameResult.value;
  }

  return nameValue;
}

export function fetchTokenSymbol(tokenAddress: Address): string {
  let contract = ERC20.bind(tokenAddress);

  let symbolValue = 'unknown';
  let symbolResult = contract.try_symbol();

  if (symbolResult.reverted) {
    /// @dev handle revert scenario with static token definition file
  } else {
    symbolValue = symbolResult.value;
  }

  return symbolValue;
}
