import { TokenData } from '../types';

/**
 * MODULE 1: Live Data Ingestion Layer
 * 
 * Source: DexScreener API (Public)
 * Mode: Read-Only / Passive
 * constraints: 
 * - No private keys
 * - No wallet interaction
 * - Strict rate limiting
 */

// A curated list of interesting Low/Mid Cap assets on Solana/Base/Eth for the demo
// These contracts are public and correspond to popular memes/protocols.
const WATCHLIST = [
    "0x6982508145454Ce325dDbE47a25d4ec3d2311933", // PEPE (ETH)
    "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm", // WIF (SOL)
    "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", // BONK (SOL)
    "0xa35923162c49cf95e6bf26623385eb431ad920d3", // TURBO (ETH)
    "0xaaee1a9723aadb7af9e326063dd7dcc5352b7b9b", // MOG (ETH)
    "0xae2fc483527b8ef99eb5d9b44875f005ba1fae13", // BRETT (BASE)
    "6AJcP7wuLwmRYLBNbi825wgguaPsWzHKsKtRG5gpfJ5", // GIGACHAD (SOL)
    "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr", // POPCAT (SOL)
    "0x59d55a960924d6735706443c2d43196f7e44a04d", // APU (ETH)
    "0x2890df158d76e584877a1d17a85fea3aeeb85aa6", // MOG (Base variant example)
].join(',');

const API_BASE = `https://api.dexscreener.com/latest/dex/tokens/${WATCHLIST}`;
const CACHE_DURATION_MS = 10000; // 10 seconds cache to respect rate limits
const MIN_LIQUIDITY_FILTER = 10000; // $10k hard floor

let lastFetchTime = 0;
let cachedData: TokenData[] = [];

/**
 * Normalizes raw API response into our strict TokenData schema
 */
const normalizeToken = (pair: any): TokenData | null => {
    try {
        // Defensive checks
        if (!pair || !pair.baseToken || !pair.priceUsd || !pair.liquidity) return null;
        
        const price = parseFloat(pair.priceUsd);
        const liquidity = pair.liquidity.usd || 0;
        const volume24h = pair.volume.h24 || 0;
        const volume1h = pair.volume.h1 || 0;
        const mCap = pair.fdv || pair.marketCap || 0;

        // Safety Filter 1: Liquidity Floor
        if (liquidity < MIN_LIQUIDITY_FILTER) return null;

        // Safety Filter 2: Dead Token
        if (volume24h === 0) return null;

        // Derived Metrics Calculation
        
        // 1. Volume Spike Factor: Comparison of hourly run-rate vs daily avg
        // If 1h volume * 24 is much higher than 24h volume, it's spiking.
        const hourlyRunRate = volume1h * 24;
        const volumeSpikeFactor = volume24h > 0 ? hourlyRunRate / volume24h : 0;

        // 2. Volatility Index Approximation (0-100)
        // Based on price change velocity
        const volatilityRaw = Math.abs(pair.priceChange.m5 || 0) * 4 + Math.abs(pair.priceChange.h1 || 0);
        const volatilityIndex = Math.min(Math.max(volatilityRaw * 2, 0), 100);

        return {
            id: pair.pairAddress,
            symbol: pair.baseToken.symbol,
            name: pair.baseToken.name || pair.baseToken.symbol,
            price: price,
            marketCap: mCap,
            volume24h: volume24h,
            liquidity: liquidity,
            holders: 0, // DexScreener doesn't always provide holder count in free tier, defaulting to 0 or keeping previous
            priceChange: {
                m5: pair.priceChange.m5 || 0,
                h1: pair.priceChange.h1 || 0,
                h24: pair.priceChange.h24 || 0,
            },
            volatilityIndex: volatilityIndex,
            momentumScore: 0, // Calculated by Scoring Engine later
            volumeSpikeFactor: volumeSpikeFactor,
            tags: [pair.chainId], // Use chain as tag
        };
    } catch (e) {
        console.warn("Failed to normalize pair:", e);
        return null;
    }
};

export const fetchLiveTokenData = async (): Promise<TokenData[]> => {
    const now = Date.now();
    
    // Return cache if request is too soon
    if (now - lastFetchTime < CACHE_DURATION_MS && cachedData.length > 0) {
        return cachedData;
    }

    try {
        const response = await fetch(API_BASE);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        
        const data = await response.json();
        
        if (!data.pairs || !Array.isArray(data.pairs)) {
            return cachedData; // Fallback to cache on bad data
        }

        // Deduplicate pairs (DexScreener might return multiple pools for same token)
        // We prefer the one with highest liquidity.
        const pairs = data.pairs.sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
        
        const uniqueSymbols = new Set();
        const normalized: TokenData[] = [];

        for (const pair of pairs) {
            if (uniqueSymbols.has(pair.baseToken.symbol)) continue;
            
            const token = normalizeToken(pair);
            if (token) {
                uniqueSymbols.add(pair.baseToken.symbol);
                normalized.push(token);
            }
        }

        lastFetchTime = now;
        cachedData = normalized;
        return normalized;

    } catch (error) {
        console.error("Live Data Ingestion Failed:", error);
        // Graceful degradation: return last known good data
        return cachedData;
    }
};