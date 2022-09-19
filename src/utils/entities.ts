import { Address, BigInt } from "@graphprotocol/graph-ts";
import { BunniToken } from "../../generated/schema";
import { ZERO_INT, ZERO_ADDR} from "./constants";

export function getBunniToken(address: Address): BunniToken {
  let bunniToken = BunniToken.load(address.toHex());

  if (bunniToken === null) {
    bunniToken = new BunniToken(address.toHex());

    bunniToken.name = '';
    bunniToken.symbol = '';
    bunniToken.address = address;
    bunniToken.decimals = ZERO_INT;
    bunniToken.precision = ZERO_INT;

    bunniToken.pool = ZERO_ADDR;
    bunniToken.tickLower = ZERO_INT;
    bunniToken.tickUpper = ZERO_INT;

    bunniToken.save();
  }

  return bunniToken as BunniToken;
}
