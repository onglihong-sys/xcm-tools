import type { TBuildEvmTransferOptions } from '@paraspell/sdk-core'
import {
  getRelayChainSymbol,
  isBridge,
  ScenarioNotSupportedError,
  UnsupportedOperationError
} from '@paraspell/sdk-core'
import type { TransactionSerializableEIP1559 } from 'viem'

import { buildXTokensEvm } from './xTokens/buildXTokensEvm'

export const buildEvmTransfer = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  options: TBuildEvmTransferOptions<TApi, TRes, TSigner, TCustomChain>
): Promise<TransactionSerializableEIP1559> => {
  const { from, to } = options

  if (from === 'Darwinia') {
    if (!isBridge(from, to) && getRelayChainSymbol(from) !== getRelayChainSymbol(to)) {
      return Promise.reject(
        new ScenarioNotSupportedError(
          'Origin and destination must share the same relay chain unless using a bridge.'
        )
      )
    }

    return Promise.resolve().then(() => buildXTokensEvm(options))
  }

  return Promise.reject(
    new UnsupportedOperationError(
      `EVM transfer from '${from}' to '${to}' is not supported by @paraspell/evm.`
    )
  )
}
