import { describe, expect, it } from 'vitest';

import { parseCustomConfig } from './customConfigIO';

describe('parseCustomConfig', () => {
  it('rejects null or malformed entries inside customChains (#2457)', () => {
    expect(() =>
      parseCustomConfig(JSON.stringify({ customChains: { EvilChain: null } })),
    ).toThrow('Custom chain "EvilChain" must be an object.');

    expect(() =>
      parseCustomConfig(
        JSON.stringify({ customChains: { EvilChain: { input: {} } } }),
      ),
    ).toThrow('Custom chain "EvilChain"');
  });

  it('rejects non-array or mistyped entries inside customAssets (#2457)', () => {
    expect(() =>
      parseCustomConfig(
        JSON.stringify({ customAssets: { AssetHubPolkadot: 'DOTDOTDOT' } }),
      ),
    ).toThrow('"customAssets.AssetHubPolkadot" must be an array.');

    expect(() =>
      parseCustomConfig(
        JSON.stringify({
          customAssets: {
            AssetHubPolkadot: [
              {
                symbol: 'DOT',
                decimals: 'ten',
                location: null,
                existentialDeposit: 12345,
              },
            ],
          },
        }),
      ),
    ).toThrow('must have a non-negative integer "decimals"');
  });

  it('accepts valid customChains and customAssets configurations', () => {
    const valid = {
      version: 1,
      customChains: {
        Bombokla: {
          input: {
            paraId: 213489,
            ecosystem: 'Polkadot',
            providers: [
              {
                name: 'Parity',
                endpoint: 'wss://polkadot-asset-hub-rpc.polkadot.io',
              },
            ],
            xcmVersion: 'V5',
          },
          assetsInfo: {
            relaychainSymbol: 'DOT',
            nativeAssetSymbol: 'DOT',
            isEVM: false,
            ss58Prefix: 34,
            supportsDryRunApi: true,
            supportsXcmPaymentApi: true,
            assets: [
              {
                symbol: 'DOT',
                decimals: 10,
                location: { parents: 1, interior: 'Here' },
                isNative: true,
                existentialDeposit: '100000000',
              },
            ],
          },
        },
      },
      customAssets: {
        AssetHubPolkadot: [
          {
            symbol: 'USDT',
            decimals: 6,
            location: { parents: 1, interior: { X1: { Parachain: 1000 } } },
            existentialDeposit: '1000',
          },
        ],
      },
    };

    const parsed = parseCustomConfig(JSON.stringify(valid));
    expect(parsed.version).toBe(1);
    expect(Object.keys(parsed.customChains)).toEqual(['Bombokla']);
    expect(parsed.customAssets.AssetHubPolkadot).toHaveLength(1);
  });
});
