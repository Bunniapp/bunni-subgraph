import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";
import { BunniToken, Token } from "../types/schema";
import { fetchTokenDecimals, fetchTokenName, fetchTokenSymbol } from "./token";

export function getBunniToken(bunniKey: Bytes): BunniToken {
  let bunniToken = Token.load(bunniKey);

  if (bunniToken === null) {
    bunniToken = new Token(bunniKey);

    bunniToken.address = Address.zero();
    bunniToken.decimals = BigInt.zero();
    bunniToken.name = '';
    bunniToken.symbol = '';

    bunniToken.save();
  }

  return bunniToken as BunniToken;
}

export function getToken(tokenAddress: Address): Token {
  let token = Token.load(tokenAddress);

  if (token === null) {
    token = new Token(tokenAddress);

    token.address = tokenAddress;
    token.decimals = fetchTokenDecimals(tokenAddress);
    token.name = fetchTokenName(tokenAddress);
    token.symbol = fetchTokenSymbol(tokenAddress);

    token.save();
  }

  return token as Token;
}