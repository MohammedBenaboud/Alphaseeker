import { info, warn } from './logger.js';

async function getFetch() {
  if (typeof fetch !== 'undefined') return fetch;
  // dynamic import node-fetch for Node <18
  try {
    const mod = await import('node-fetch');
    return mod.default || mod;
  } catch (e) {
    throw new Error('No fetch available in environment and node-fetch not installed');
  }
}

// Supported chains mapping (DexScreener path expects these names)
const CHAIN_MAP = {
  ethereum: 'ethereum',
  bsc: 'bsc',
  solana: 'solana'
};

// Fetch pairs for a chain from DexScreener
export async function fetchPairsForChain(chain) {
  const name = CHAIN_MAP[chain];
  if (!name) throw new Error(`Unsupported chain: ${chain}`);

  const urlCandidates = [
    `https://api.dexscreener.com/latest/dex/pairs/chain/${name}`,
    `https://api.dexscreener.com/latest/dex/pairs/${name}`,
    `https://api.dexscreener.com/latest/dex/pairs?chain=${name}`,
    `https://api.dexscreener.com/latest/dex/${name}`
  ];
  let res, json;
  let lastErr = null;
  for (const url of urlCandidates) {
    info('Fetching DexScreener', url);
    try {
      const fn = await getFetch();
      res = await fn(url);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      json = await res.json();
      break;
    } catch (e) {
      lastErr = e;
      warn('Fetch candidate failed', url, e && e.message);
    }
  }
  if (!json) {
    throw lastErr || new Error('Failed to fetch from DexScreener');
  }

  // DexScreener returns an object with a 'pairs' array (best-effort parsing)
  const rawPairs = json.pairs || json.pairsList || json; // defensive

  if (!Array.isArray(rawPairs)) {
    warn('Unexpected DexScreener response shape, returning empty list');
    return [];
  }

  // Normalize pairs and filter low liquidity
  const pairs = rawPairs.map(p => {
    // Best-effort field mapping
    const pairAddress = p.pairAddress || p.pair || p.address || p.pairAddress || p.dexPairAddress || p.id;
    const base = p.baseToken || p.base || (p.baseTokenInfo && p.baseTokenInfo.symbol) || (p.base_token && p.base_token.symbol) || {};
    const quote = p.quoteToken || p.quote || (p.quoteTokenInfo && p.quoteTokenInfo.symbol) || (p.quote_token && p.quote_token.symbol) || {};
    const priceUsd = Number(p.priceUsd ?? (p.price && p.price.usd) ?? p.priceUsd ?? 0);
    const liquidityUsd = Number(p.liquidity?.usd ?? p.liquidityUsd ?? p.liquidity ?? 0);
    const volumeH24 = Number(p.volume?.h24 ?? p.volumeH24 ?? p.volume24h ?? p.h24 ?? 0);
    const priceChangeH1 = Number(p.priceChange?.h1 ?? p.priceChangeH1 ?? p.h1 ?? 0);
    const priceChangeH24 = Number(p.priceChange?.h24 ?? p.priceChangeH24 ?? p.h24 ?? 0);
    const createdAt = p.createdAt || p.listedAt || p.addedAt || p.pairCreatedAt || null;

    return {
      pairAddress,
      baseToken: typeof base === 'string' ? { symbol: base } : (base.symbol ? base : { symbol: base.name || base.symbol || 'UNK' }),
      quoteToken: typeof quote === 'string' ? { symbol: quote } : (quote.symbol ? quote : { symbol: quote.name || quote.symbol || 'UNK' }),
      priceUsd: Number(priceUsd || 0),
      liquidityUsd: Number(liquidityUsd || 0),
      volumeH24: Number(volumeH24 || 0),
      priceChangeH1: Number(priceChangeH1 || 0),
      priceChangeH24: Number(priceChangeH24 || 0),
      createdAt
    };
  })
  .filter(p => p.liquidityUsd >= 10000 && p.priceUsd > 0);

  info(`Fetched ${pairs.length} pairs for ${chain} (after liquidity filter)`);
  return pairs;
}

export async function fetchAllSupportedChains() {
  const chains = Object.keys(CHAIN_MAP);
  const results = {};
  for (const c of chains) {
    try {
      results[c] = await fetchPairsForChain(c);
    } catch (err) {
      warn('Failed to fetch chain', c, err.message);
      results[c] = [];
    }
  }
  return results;
}

export default { fetchPairsForChain, fetchAllSupportedChains };
