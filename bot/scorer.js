// Simple scoring engine for "shitcoin" opportunities
// Score 0-100 based on liquidity, volume, momentum, and age

export function scorePair(pair) {
  // Normalization helpers (min-max with clamping)
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // Liquidity score: log scaling
  const liq = Math.log10(pair.liquidityUsd + 1);
  const liqScore = clamp((liq - 4) / 4, 0, 1); // maps ~10k (log=4) -> 0, 1e8 (log=8) -> 1

  // Volume score: relative to liquidity
  const volumeRatio = pair.volumeH24 / (pair.liquidityUsd || 1);
  const volScore = clamp(volumeRatio * 5, 0, 1); // scaled

  // Momentum score: combine h1 and h24 price change
  const momentum = (pair.priceChangeH1 * 0.6) + (pair.priceChangeH24 * 0.4);
  const momentumScore = clamp((momentum + 50) / 100, 0, 1); // rough normalize

  // Age: newer is favored. If createdAt missing, neutral (0.5)
  let ageScore = 0.5;
  if (pair.createdAt) {
    const ts = new Date(pair.createdAt).getTime();
    if (!Number.isNaN(ts)) {
      const ageDays = (Date.now() - ts) / (1000 * 60 * 60 * 24);
      // newer = higher score. ageDays=0 -> 1, ageDays=30 -> 0
      ageScore = clamp(1 - (ageDays / 30), 0, 1);
    }
  }

  // Weighted composition
  const weights = {
    liquidity: 0.25,
    volume: 0.25,
    momentum: 0.3,
    age: 0.2
  };

  const raw = (liqScore * weights.liquidity) + (volScore * weights.volume) + (momentumScore * weights.momentum) + (ageScore * weights.age);
  const score = Math.round(clamp(raw, 0, 1) * 100);

  return { score, components: { liqScore, volScore, momentumScore, ageScore } };
}

export function rankPairs(pairs, topN = 50) {
  const scored = pairs.map(p => ({ pair: p, ...scorePair(p) }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topN);
}

export default { scorePair, rankPairs };
