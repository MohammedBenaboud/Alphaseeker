import { TokenData, ScoringConfig } from '../types';

const DEFAULT_CONFIG: ScoringConfig = {
  volumeWeight: 0.35,
  momentumWeight: 0.30,
  liquidityWeight: 0.20,
  volatilityWeight: 0.15,
  minLiquidity: 50000, // $50k min liquidity filter
};

/**
 * Calculates a proprietary "Alpha Score" (0-100) based on quantitative metrics.
 * Higher score = Better potential (purely statistical, not financial advice).
 */
export const calculateAlphaScore = (token: TokenData, config: ScoringConfig = DEFAULT_CONFIG): number => {
  // 1. Filter: Immediate fail if liquidity is too low (Rug risk)
  if (token.liquidity < config.minLiquidity) {
    return 0;
  }

  // 2. Volume Component (Normalized)
  // We prefer volume that is high relative to Market Cap (High turnover = interest)
  const volumeToMcapRatio = token.volume24h / token.marketCap;
  // Cap ratio at 1.0 for scoring purposes (if volume > mcap, it's extremely viral)
  const volumeScore = Math.min(volumeToMcapRatio, 1) * 100;

  // 3. Momentum Component
  // Weighted average of timeframes, favoring recent action
  const momentumRaw = (token.priceChange.m5 * 4) + (token.priceChange.h1 * 2) + token.priceChange.h24;
  // Normalize momentum to 0-100 scale (assuming max likely raw momentum is ~100)
  const momentumScore = Math.min(Math.max(momentumRaw + 50, 0), 100);

  // 4. Liquidity Health
  // Higher liquidity/mcap ratio is healthier
  const liquidityRatio = token.liquidity / token.marketCap;
  const liquidityScore = Math.min(liquidityRatio * 500, 100); // 20% liquidity = 100 score

  // 5. Volatility penalty/reward
  // For "Alpha", we actually want some volatility, but not 100% chaos.
  // Optimal volatility is around 60-80.
  const volatilityDist = Math.abs(token.volatilityIndex - 70);
  const volatilityScore = Math.max(100 - (volatilityDist * 2), 0);

  // Weighted Sum
  const totalScore = (
    (volumeScore * config.volumeWeight) +
    (momentumScore * config.momentumWeight) +
    (liquidityScore * config.liquidityWeight) +
    (volatilityScore * config.volatilityWeight)
  );

  return Math.floor(totalScore);
};

export const processMarketBatch = (tokens: TokenData[]): TokenData[] => {
  return tokens.map(t => ({
    ...t,
    momentumScore: calculateAlphaScore(t)
  })).sort((a, b) => b.momentumScore - a.momentumScore);
};