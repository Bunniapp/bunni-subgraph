import { Address, BigInt, TypedMap } from "@graphprotocol/graph-ts";

export const BUNNI_HUB = Address.fromString("0xb5087F95643A9a4069471A28d32C569D9bd57fE4");
export const BUNNI_LENS = Address.fromString("0xb73F303472C4fD4FF3B9f59ce0F9b13E47fbfD19");

export const DAY = BigInt.fromI32(86400);
export const WEEK = BigInt.fromI32(604800);

export let CHAIN_ID = new TypedMap<string, BigInt>();
CHAIN_ID.set('mainnet', BigInt.fromI32(1));
CHAIN_ID.set('goerli', BigInt.fromI32(5));
CHAIN_ID.set('optimism', BigInt.fromI32(10));
CHAIN_ID.set('matic', BigInt.fromI32(137));
CHAIN_ID.set('arbitrum-one', BigInt.fromI32(42161));