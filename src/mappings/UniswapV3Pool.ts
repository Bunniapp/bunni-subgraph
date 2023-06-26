import { Address, BigDecimal, ethereum } from "@graphprotocol/graph-ts";
import { Mint, Burn, Swap } from "../types/templates/UniswapV3Pool/UniswapV3Pool";
import { BunniLens, BunniLens__getReservesInputKeyStruct } from "../types/templates/UniswapV3Pool/BunniLens";

import { BUNNI_LENS } from "../utils/constants";
import { getBunniToken, getPool, getToken } from "../utils/entities";
import { convertToDecimals } from "../utils/math";

export function handleMint(event: Mint): void {}

export function handleBurn(event: Burn): void {}

export function handleSwap(event: Swap): void {
  let pool = getPool(event.address);

  let token0 = getToken(Address.fromBytes(pool.token0));
  let token1 = getToken(Address.fromBytes(pool.token1));

  /// update bunni token(s) data
  let bunniLens = BunniLens.bind(BUNNI_LENS);

  for(let i = 0; i < pool.bunniTokens.length; ++i) {
    let bunniToken = getBunniToken(pool.bunniTokens[i]);
    
    if (bunniToken.totalSupply.gt(BigDecimal.zero())) {
      /// generate the key struct
      let key = new BunniLens__getReservesInputKeyStruct();
      key.push(ethereum.Value.fromBytes(pool.address));
      key.push(ethereum.Value.fromSignedBigInt(bunniToken.tickLower));
      key.push(ethereum.Value.fromSignedBigInt(bunniToken.tickUpper));

      let reserveResult = bunniLens.try_getReserves(key);

      if (!reserveResult.reverted) {
        /// update the position reserves
        bunniToken.token0Reserve = convertToDecimals(reserveResult.value.value0, token0.decimals);
        bunniToken.token1Reserve = convertToDecimals(reserveResult.value.value1, token1.decimals);
      }

      bunniToken.save();
    }    
  }
}