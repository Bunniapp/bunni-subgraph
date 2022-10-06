import { Transfer } from "../../generated/templates/ERC20/ERC20";

import { ZERO_ADDR } from "../utils/constants";
import { getBunniToken } from "../utils/entities";
import { normalize } from "../utils/math";

export function handleTransfer(event: Transfer): void {
  let bunniToken = getBunniToken(event.address);
  let value = normalize(event.params.value, bunniToken.decimals.toI32());

  // minted, increment total supply
  if (event.params.from.equals(ZERO_ADDR)) {
    bunniToken.totalSupply = bunniToken.totalSupply.plus(value);
  }

  // burned, decrement total supply
  if (event.params.to.equals(ZERO_ADDR)) {
    bunniToken.totalSupply = bunniToken.totalSupply.minus(value);
  }

  bunniToken.save();
}
