import { Address, BigInt } from "@graphprotocol/graph-ts";
import { BunniHub, Compound, Deposit, NewBunni, PayProtocolFee, SetProtocolFee, Withdraw } from "../../generated/BunniHub/BunniHub";
import { ERC20 } from "../../generated/BunniHub/ERC20";
import { BunniToken } from "../../generated/schema";

import { BUNNI_HUB } from "../utils/constants";
import { getBunni, getBunniToken, getPool } from "../utils/entities";
import { uniswapV3PositionKey } from "../utils/helpers";
import { tenPow } from "../utils/math";

export function handleCompound(event: Compound): void {
  let bunniToken = getBunniToken(event.params.bunniKeyHash);

  let liquidity = bunniToken.liquidity;
  liquidity = liquidity.plus(event.params.liquidity);
  bunniToken.liquidity = liquidity;

  bunniToken.save();
}

export function handleDeposit(event: Deposit): void {
  let bunniToken = getBunniToken(event.params.bunniKeyHash);

  let liquidity = bunniToken.liquidity;
  liquidity = liquidity.plus(event.params.liquidity);
  bunniToken.liquidity = liquidity;

  bunniToken.save();
}

export function handleNewBunni(event: NewBunni): void {
  let bunni = getBunni();

  let pool = getPool(event.params.pool);
  let bunniToken = getBunniToken(event.params.bunniKeyHash);
  let bunniTokenContract = ERC20.bind(event.params.token);

  let name = bunniTokenContract.name();
  let symbol = bunniTokenContract.symbol();
  let decimals = bunniTokenContract.decimals();

  bunniToken.name = name;
  bunniToken.symbol = symbol;
  bunniToken.address = event.params.token;
  bunniToken.decimals = BigInt.fromI32(decimals);
  bunniToken.precision = tenPow(decimals);

  bunniToken.pool = pool.id;
  bunniToken.tickLower = BigInt.fromI32(event.params.tickLower);
  bunniToken.tickUpper = BigInt.fromI32(event.params.tickUpper);

  bunniToken.positionKey = uniswapV3PositionKey(BUNNI_HUB, event.params.tickLower, event.params.tickUpper)

  bunniToken.save();
}

export function handlePayProtocolFee(event: PayProtocolFee): void {
  let bunni = getBunni();
  bunni.save();
}

export function handleSetProtocolFee(event: SetProtocolFee): void {
  let bunni = getBunni();
  bunni.protocolFee = event.params.newProtocolFee;
  bunni.save();
}

export function handleWithdraw(event: Withdraw): void {
  let bunniToken = getBunniToken(event.params.bunniKeyHash);

  let liquidity = bunniToken.liquidity;
  liquidity = liquidity.minus(event.params.liquidity);
  bunniToken.liquidity = liquidity;

  bunniToken.save();
}
