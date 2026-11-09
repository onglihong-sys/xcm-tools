import type { TCustomAssetsMap } from '@paraspell/sdk';

import type { TStoredCustomChains } from '../types/TCustomChain';

const CONFIG_VERSION = 1;

export type TCustomConfigFile = {
  version: number;
  customChains: TStoredCustomChains;
  customAssets: TCustomAssetsMap;
};

export const buildCustomConfig = (
  customChains: TStoredCustomChains,
  customAssets: TCustomAssetsMap,
): TCustomConfigFile => ({
  version: CONFIG_VERSION,
  customChains,
  customAssets,
});

export const downloadCustomConfig = (config: TCustomConfigFile) => {
  const blob = new Blob([JSON.stringify(config, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'paraspell-custom-config.json';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isNonNegativeInt = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0;

const validateAssetEntry = (asset: unknown, label: string): void => {
  if (!isRecord(asset)) {
    throw new Error(`${label} must be an object.`);
  }
  if (!isNonEmptyString(asset.symbol)) {
    throw new Error(`${label} must have a non-empty string "symbol".`);
  }
  if (!isNonNegativeInt(asset.decimals)) {
    throw new Error(`${label} must have a non-negative integer "decimals".`);
  }
  if (!isRecord(asset.location)) {
    throw new Error(`${label} must have a valid "location" object.`);
  }
  if (typeof asset.existentialDeposit !== 'string') {
    throw new Error(`${label} must have a string "existentialDeposit".`);
  }
  try {
    BigInt(asset.existentialDeposit);
  } catch {
    throw new Error(`${label} "existentialDeposit" must be a valid integer string.`);
  }
  if (asset.isNative !== undefined && typeof asset.isNative !== 'boolean') {
    throw new Error(`${label} "isNative" must be a boolean when provided.`);
  }
};

const validateCustomChainEntry = (entry: unknown, name: string): void => {
  if (!isRecord(entry)) {
    throw new Error(`Custom chain "${name}" must be an object.`);
  }
  const { input, assetsInfo } = entry;
  if (!isRecord(input)) {
    throw new Error(`Custom chain "${name}" is missing a valid "input" object.`);
  }
  if (!isNonNegativeInt(input.paraId)) {
    throw new Error(`Custom chain "${name}" must have a non-negative integer "paraId".`);
  }
  if (!isNonEmptyString(input.ecosystem)) {
    throw new Error(`Custom chain "${name}" must have a valid "ecosystem".`);
  }
  if (!Array.isArray(input.providers) || input.providers.length === 0) {
    throw new Error(`Custom chain "${name}" must have a non-empty "providers" array.`);
  }
  for (const provider of input.providers) {
    if (!isRecord(provider) || !isNonEmptyString(provider.name) || !isNonEmptyString(provider.endpoint)) {
      throw new Error(`Custom chain "${name}" contains an invalid provider entry.`);
    }
  }
  if (!isRecord(assetsInfo)) {
    throw new Error(`Custom chain "${name}" is missing a valid "assetsInfo" object.`);
  }
  if (!Array.isArray(assetsInfo.assets)) {
    throw new Error(`Custom chain "${name}" "assetsInfo.assets" must be an array.`);
  }
  assetsInfo.assets.forEach((asset, idx) =>
    validateAssetEntry(asset, `Custom chain "${name}" asset[${idx}]`),
  );
};

export const parseCustomConfig = (text: string): TCustomConfigFile => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('File is not valid JSON.');
  }

  if (!isRecord(parsed)) {
    throw new Error('Config must be a JSON object.');
  }

  const { customChains, customAssets } = parsed;

  if (customChains !== undefined && !isRecord(customChains)) {
    throw new Error('"customChains" must be an object.');
  }

  if (customAssets !== undefined && !isRecord(customAssets)) {
    throw new Error('"customAssets" must be an object.');
  }

  if (customChains === undefined && customAssets === undefined) {
    throw new Error(
      'Config must contain "customChains" and/or "customAssets".',
    );
  }

  if (customChains !== undefined) {
    for (const [chainName, entry] of Object.entries(customChains)) {
      validateCustomChainEntry(entry, chainName);
    }
  }

  if (customAssets !== undefined) {
    for (const [chainName, assets] of Object.entries(customAssets)) {
      if (!Array.isArray(assets)) {
        throw new Error(`"customAssets.${chainName}" must be an array.`);
      }
      assets.forEach((asset, idx) =>
        validateAssetEntry(asset, `"customAssets.${chainName}[${idx}]"`),
      );
    }
  }

  return {
    version:
      typeof parsed.version === 'number' ? parsed.version : CONFIG_VERSION,
    customChains: (customChains ?? {}) as TStoredCustomChains,
    customAssets: (customAssets ?? {}) as TCustomAssetsMap,
  };
};
