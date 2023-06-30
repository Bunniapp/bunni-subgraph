import { Address, BigDecimal, BigInt, ByteArray, DataSourceContext, crypto } from "@graphprotocol/graph-ts";
import { Compound, Deposit, NewBunni, PayProtocolFee, SetProtocolFee, Withdraw } from "../types/BunniHub/BunniHub";
import { BunniToken as BunniTokenTemplate } from "../types/templates";

import { getBunni, getBunniToken, getPool, getToken, getUser, getUserPosition } from "../utils/entities";
import { convertToDecimals } from "../utils/math";
import { fetchTokenDecimals, fetchTokenName, fetchTokenSymbol } from "../utils/token";
import { fetchPricePerFullShare, fetchReserves } from "../utils/lens";

export function handleCompound(event: Compound): void {
  let bunniToken = getBunniToken(event.params.bunniKeyHash);

  /// load the ancillary entities
  let pool = getPool(Address.fromBytes(bunniToken.pool));
  let token0 = getToken(Address.fromBytes(pool.token0));
  let token1 = getToken(Address.fromBytes(pool.token1));

  /// update the position liquidity
  bunniToken.liquidity = bunniToken.liquidity.plus(event.params.liquidity);

  /// reset pool aggregates until new amounts calculated
  pool.reserve0 = pool.reserve0.minus(bunniToken.reserve0);
  pool.reserve1 = pool.reserve1.minus(bunniToken.reserve1);

  /// update the position reserves
  let reserves: BigInt[] = fetchReserves(pool.address, bunniToken.tickLower, bunniToken.tickUpper);
  bunniToken.reserve0 = convertToDecimals(reserves[0], token0.decimals);
  bunniToken.reserve1 = convertToDecimals(reserves[1], token1.decimals);

  /// update the position shares
  let pricePerFullShare: BigInt[] = fetchPricePerFullShare(pool.address, bunniToken.tickLower, bunniToken.tickUpper);
  bunniToken.amount0PerShare = convertToDecimals(pricePerFullShare[1], token0.decimals);
  bunniToken.amount1PerShare = convertToDecimals(pricePerFullShare[2], token1.decimals);

  /// update the pool aggregates with new amounts
  pool.reserve0 = pool.reserve0.plus(bunniToken.reserve0);
  pool.reserve1 = pool.reserve1.plus(bunniToken.reserve1);

  bunniToken.save();
  pool.save();
}

export function handleDeposit(event: Deposit): void {
  let bunniToken = getBunniToken(event.params.bunniKeyHash);
  let user = getUser(event.params.recipient);
  let userPosition = getUserPosition(bunniToken, user);

  /// load the ancillary entities
  let pool = getPool(Address.fromBytes(bunniToken.pool));
  let token0 = getToken(Address.fromBytes(pool.token0));
  let token1 = getToken(Address.fromBytes(pool.token1));

  /// update the position liquidity
  bunniToken.liquidity = bunniToken.liquidity.plus(event.params.liquidity);
  
  /// update bunni token total supply
  let shares = convertToDecimals(event.params.shares, bunniToken.decimals);
  bunniToken.totalSupply = bunniToken.totalSupply.plus(shares);

  /// reset pool aggregates until new amounts calculated
  pool.reserve0 = pool.reserve0.minus(bunniToken.reserve0);
  pool.reserve1 = pool.reserve1.minus(bunniToken.reserve1);

  /// update the position reserves
  let reserves: BigInt[] = fetchReserves(pool.address, bunniToken.tickLower, bunniToken.tickUpper);
  bunniToken.reserve0 = convertToDecimals(reserves[0], token0.decimals);
  bunniToken.reserve1 = convertToDecimals(reserves[1], token1.decimals);

  /// update the position shares
  let pricePerFullShare: BigInt[] = fetchPricePerFullShare(pool.address, bunniToken.tickLower, bunniToken.tickUpper);
  bunniToken.amount0PerShare = convertToDecimals(pricePerFullShare[1], token0.decimals);
  bunniToken.amount1PerShare = convertToDecimals(pricePerFullShare[2], token1.decimals);

  /// update the pool aggregates with new amounts
  pool.reserve0 = pool.reserve0.plus(bunniToken.reserve0);
  pool.reserve1 = pool.reserve1.plus(bunniToken.reserve1);

  /// update the user position balance and cost basis per share
  let token0CostBasis = userPosition.token0CostBasisPerShare.times(userPosition.balance).plus(bunniToken.amount0PerShare.times(shares));
  let token1CostBasis = userPosition.token1CostBasisPerShare.times(userPosition.balance).plus(bunniToken.amount1PerShare.times(shares));
  userPosition.balance = userPosition.balance.plus(shares);
  if (userPosition.balance.gt(BigDecimal.zero())) {
    userPosition.token0CostBasisPerShare = token0CostBasis.div(userPosition.balance);
    userPosition.token1CostBasisPerShare = token1CostBasis.div(userPosition.balance);
  }
  
  bunniToken.save();
  pool.save();
  userPosition.save();
}

export function handleNewBunni(event: NewBunni): void {
  let pool = getPool(event.params.pool);
  let bunniToken = getBunniToken(event.params.bunniKeyHash);
  let bunni = getBunni();

  /// update the token info
  bunniToken.address = event.params.token;
  bunniToken.decimals = fetchTokenDecimals(event.params.token);
  bunniToken.name = fetchTokenName(event.params.token);
  bunniToken.symbol = fetchTokenSymbol(event.params.token);

  /// update the position ticks
  bunniToken.tickLower = BigInt.fromI32(event.params.tickLower);
  bunniToken.tickUpper = BigInt.fromI32(event.params.tickUpper);

  /// add pool to the bunni token entity
  bunniToken.pool = pool.id;

  /// add bunni token to the pool entity
  let bunniTokens = pool.bunniTokens;
  bunniTokens.push(bunniToken.id);
  pool.bunniTokens = bunniTokens;

  bunniToken.save();
  pool.save();

  let bunniTokenContext = new DataSourceContext();
  bunniTokenContext.setBytes("bunniKeyHash", event.params.bunniKeyHash);
  BunniTokenTemplate.createWithContext(event.params.token, bunniTokenContext);
}

export function handlePayProtocolFee(event: PayProtocolFee): void {
  const eventReceipt = event.receipt;

  if (eventReceipt) {
    const eventLogs = eventReceipt.logs;
    const signatureHash = crypto.keccak256(ByteArray.fromUTF8("Compound(address,bytes32,uint128,uint256,uint256)"));

    for (let i = 0; i < eventLogs.length; i++) {
      if (eventLogs[i].topics[0].toHex() == signatureHash.toHex()) {
        let bunniToken = getBunniToken(eventLogs[i].topics[2]);

        /// load the ancillary entities
        let pool = getPool(Address.fromBytes(bunniToken.pool));
        let token0 = getToken(Address.fromBytes(pool.token0));
        let token1 = getToken(Address.fromBytes(pool.token1));

        /// update the bunni token fees
        bunniToken.token0CollectedFees = bunniToken.token0CollectedFees.plus(convertToDecimals(event.params.amount0, token0.decimals));
        bunniToken.token1CollectedFees = bunniToken.token1CollectedFees.plus(convertToDecimals(event.params.amount1, token1.decimals));
        bunniToken.save();

        // update the pool aggregates with new amounts
        pool.token0CollectedFees = pool.token0CollectedFees.plus(convertToDecimals(event.params.amount0, token0.decimals));
        pool.token1CollectedFees = pool.token1CollectedFees.plus(convertToDecimals(event.params.amount1, token1.decimals));
        pool.save();
      }
    }
  }
}

export function handleSetProtocolFee(event: SetProtocolFee): void {
  let bunni = getBunni();
  bunni.protocolFee = convertToDecimals(event.params.newProtocolFee, BigInt.fromI32(18));
  bunni.save();
}

export function handleWithdraw(event: Withdraw): void {
  let bunniToken = getBunniToken(event.params.bunniKeyHash);
  let user = getUser(event.params.sender);
  let userPosition = getUserPosition(bunniToken, user);

  /// load the ancillary entities
  let pool = getPool(Address.fromBytes(bunniToken.pool));
  let token0 = getToken(Address.fromBytes(pool.token0));
  let token1 = getToken(Address.fromBytes(pool.token1));

  /// update the position liquidity
  bunniToken.liquidity = bunniToken.liquidity.minus(event.params.liquidity);

  /// update bunni token total supply
  let shares = convertToDecimals(event.params.shares, bunniToken.decimals);
  bunniToken.totalSupply = bunniToken.totalSupply.minus(shares);

  /// reset pool aggregates until new amounts calculated
  pool.reserve0 = pool.reserve0.minus(bunniToken.reserve0);
  pool.reserve1 = pool.reserve1.minus(bunniToken.reserve1);

  /// update the position reserves
  let reserves: BigInt[] = fetchReserves(pool.address, bunniToken.tickLower, bunniToken.tickUpper);
  bunniToken.reserve0 = convertToDecimals(reserves[0], token0.decimals);
  bunniToken.reserve1 = convertToDecimals(reserves[1], token1.decimals);

  /// update the position shares
  let pricePerFullShare: BigInt[] = fetchPricePerFullShare(pool.address, bunniToken.tickLower, bunniToken.tickUpper);
  bunniToken.amount0PerShare = convertToDecimals(pricePerFullShare[1], token0.decimals);
  bunniToken.amount1PerShare = convertToDecimals(pricePerFullShare[2], token1.decimals);

  /// update the pool aggregates with new amounts
  pool.reserve0 = pool.reserve0.plus(bunniToken.reserve0);
  pool.reserve1 = pool.reserve1.plus(bunniToken.reserve1);

  /// update the user position balance
  userPosition.balance = userPosition.balance.minus(shares);

  bunniToken.save();
  pool.save();
  userPosition.save();
}