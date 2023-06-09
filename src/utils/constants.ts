import { Address, BigInt, BigDecimal, TypedMap } from "@graphprotocol/graph-ts";

export let BUNNI_HUB = Address.fromString('0xb5087F95643A9a4069471A28d32C569D9bd57fE4');

export let ZERO_BD = BigDecimal.fromString("0");
export let ZERO_INT = BigInt.fromI32(0);
export let ZERO_ADDR = Address.fromString('0x0000000000000000000000000000000000000000');

export let ONE_BD = BigDecimal.fromString("1");
export let ONE_INT = BigInt.fromI32(1);

export let WEEK = BigInt.fromI32(604800);

export let CHAIN_ID = new TypedMap<string, BigInt>();
CHAIN_ID.set('mainnet', BigInt.fromI32(1));
CHAIN_ID.set('goerli', BigInt.fromI32(5));
CHAIN_ID.set('optimism', BigInt.fromI32(10));
CHAIN_ID.set('matic', BigInt.fromI32(137));
CHAIN_ID.set('arbitrum-one', BigInt.fromI32(42161));