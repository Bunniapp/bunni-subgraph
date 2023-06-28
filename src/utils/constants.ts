import { Address, BigInt, TypedMap } from "@graphprotocol/graph-ts";

export const BUNNI_LENS = Address.fromString("0xb73F303472C4fD4FF3B9f59ce0F9b13E47fbfD19");

export let CHAIN_ID = new TypedMap<string, BigInt>();
CHAIN_ID.set('mainnet', BigInt.fromI32(1));
CHAIN_ID.set('goerli', BigInt.fromI32(5));
CHAIN_ID.set('optimism', BigInt.fromI32(10));
CHAIN_ID.set('matic', BigInt.fromI32(137));
CHAIN_ID.set('arbitrum-one', BigInt.fromI32(42161));