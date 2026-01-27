import { TokenData } from '../types';

const SYMBOLS = ['PEPE', 'WIF', 'BONK', 'TURBO', 'MOG', 'SPX', 'POPCAT', 'BRETT', 'GIGACHAD', 'APU'];

// Helper to generate random consistent data
const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;

export const generateMarketSnapshot = (): TokenData[] => {
  return SYMBOLS.map((sym, index) => {
    // Deterministic-ish base values salted with randomness
    const basePrice = 0.00001 * (index + 1) + randomRange(-0.000001, 0.000001);
    const mCap = randomRange(5000000, 500000000);
    const liquidity = mCap * randomRange(0.05, 0.15); // Liquidity usually 5-15% of mcap for these
    
    // Simulate some "action"
    const spike = Math.random() > 0.8; // 20% chance of a volume spike
    const volumeMultiplier = spike ? randomRange(2, 5) : randomRange(0.5, 1.2);
    
    return {
      id: `token-${index}`,
      symbol: sym,
      name: `${sym} Protocol`,
      price: basePrice,
      marketCap: mCap,
      volume24h: (mCap * 0.1) * volumeMultiplier,
      liquidity: liquidity,
      holders: Math.floor(randomRange(1000, 50000)),
      priceChange: {
        m5: randomRange(-2, 3), // Volatile
        h1: randomRange(-5, 8),
        h24: randomRange(-15, 25),
      },
      volatilityIndex: randomRange(40, 95),
      volumeSpikeFactor: volumeMultiplier,
      momentumScore: 0, // Calculated later
      tags: spike ? ['High Vol', 'Trending'] : ['Stable'],
    };
  });
};

export const updateTokenPrice = (token: TokenData): TokenData => {
  const change = randomRange(-0.02, 0.02); // 2% flux per tick
  const newPrice = token.price * (1 + change);
  return {
    ...token,
    price: newPrice,
    priceChange: {
      ...token.priceChange,
      m5: token.priceChange.m5 + (change * 100),
    }
  };
};