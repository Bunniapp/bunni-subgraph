import { Address, BigDecimal, ByteArray, Bytes, crypto, dataSource, ethereum } from "@graphprotocol/graph-ts";
import { Transfer } from "../types/templates/BunniToken/BunniToken";
import { getBunniToken, getGauge, getUser, getUserPosition } from "../utils/entities";
import { convertToDecimals } from "../utils/math";

export function handleTransfer(event: Transfer): void {
  /// ignore minting and burning events
  if (event.params.from != Address.zero() && event.params.to != Address.zero()) {
    let bunniToken = getBunniToken(dataSource.context().getBytes("bunniKeyHash"));

    let amount = convertToDecimals(event.params.value, bunniToken.decimals);

    if (bunniToken.gauge !== null && event.params.from == getGauge(bunniToken.gauge as Bytes).address) {
      /// bunni token was sent from the gauge contract
      let toPosition = getUserPosition(bunniToken, getUser(event.params.to));
      toPosition.balance = toPosition.balance.plus(amount);
      toPosition.save();
    } else if (bunniToken.gauge !== null && event.params.to == getGauge(bunniToken.gauge as Bytes).address) {
      /// bunni token was sent to the gauge contract
      let fromPosition = getUserPosition(bunniToken, getUser(event.params.from));
      fromPosition.balance = fromPosition.balance.minus(amount);
      fromPosition.save();

      const eventReceipt = event.receipt;
      if (eventReceipt) {
        const eventLogs = eventReceipt.logs;
        const signatureHash = crypto.keccak256(ByteArray.fromUTF8("Deposit(address,uint256)"));

        for (let i = 0; i < eventLogs.length; i++) {
          if (eventLogs[i].topics[0].toHex() == signatureHash.toHex()) {
            let provider = ethereum.decode('address', eventLogs[i].topics[1]);

            if (provider && event.params.from != provider.toAddress()) {
              /// update provider user position, accounting for the cost basis of the amount transferred
              let providerPosition = getUserPosition(bunniToken, getUser(provider.toAddress()));

              let providerOldTotalBalance = providerPosition.balance.plus(providerPosition.gaugeBalance);
              let providerNewTotalBalance = providerPosition.balance.plus(providerPosition.gaugeBalance).plus(amount);

              let token0CostBasis = providerPosition.token0CostBasisPerShare.times(providerOldTotalBalance).plus(fromPosition.token0CostBasisPerShare.times(amount));
              let token1CostBasis = providerPosition.token1CostBasisPerShare.times(providerOldTotalBalance).plus(fromPosition.token1CostBasisPerShare.times(amount));
              if (providerNewTotalBalance.gt(BigDecimal.zero())) {
                providerPosition.token0CostBasisPerShare = token0CostBasis.div(providerNewTotalBalance);
                providerPosition.token1CostBasisPerShare = token1CostBasis.div(providerNewTotalBalance);
              }

              providerPosition.save();
            }
          }
        }
      }
    } else {
      /// normal transfer
      let fromPosition = getUserPosition(bunniToken, getUser(event.params.from));
      let toPosition = getUserPosition(bunniToken, getUser(event.params.to));

      /// update sender user position
      fromPosition.balance = fromPosition.balance.minus(amount);

      /// update recipient user position, accounting for the cost basis of the amount transferred
      let toOldTotalBalance = toPosition.balance.plus(toPosition.gaugeBalance);
      let toNewTotalBalance = toPosition.balance.plus(toPosition.gaugeBalance).plus(amount);

      let token0CostBasis = toPosition.token0CostBasisPerShare.times(toOldTotalBalance).plus(fromPosition.token0CostBasisPerShare.times(amount));
      let token1CostBasis = toPosition.token1CostBasisPerShare.times(toOldTotalBalance).plus(fromPosition.token1CostBasisPerShare.times(amount));
      if (toNewTotalBalance.gt(BigDecimal.zero())) {
        toPosition.token0CostBasisPerShare = token0CostBasis.div(toNewTotalBalance);
        toPosition.token1CostBasisPerShare = token1CostBasis.div(toNewTotalBalance);
      }
      toPosition.balance = toPosition.balance.plus(amount);

      fromPosition.save();
      toPosition.save();
    }
  }
}