import { Address, Bytes, ByteArray, crypto, ethereum } from "@graphprotocol/graph-ts";


export function encodeKey(owner: Address, tickLower: i32, tickUpper: i32): Bytes {
    const tupleArray: Array<ethereum.Value> = [
        ethereum.Value.fromAddress(owner),
        ethereum.Value.fromI32(tickLower),
        ethereum.Value.fromI32(tickUpper),
    ];
    const tuple = changetype<ethereum.Tuple>(tupleArray);

    const encoded = ethereum.encode(ethereum.Value.fromTuple(tuple)) as Bytes;
    return encoded;
}

export function uniswapV3PositionKey(owner: Address, tickLower: i32, tickUpper: i32): Bytes {
    const encodedHex = encodeKey(owner, tickLower, tickUpper).toHex();
    const encodedPacked = "0x" + encodedHex.substr(26, 40) + encodedHex.substr(124, 6) + encodedHex.substr(188, 6);

    const keyArray = crypto.keccak256(ByteArray.fromHexString(encodedPacked));
    const key = Bytes.fromByteArray(keyArray);

    return key as Bytes;

}