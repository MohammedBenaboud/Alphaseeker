import { scorePair, rankPairs } from './scorer.js';
import { paperLog, info } from './logger.js';

// Simple strategy: buy top-scoring pairs if score >= threshold and momentum positive
// Sell when profit target reached or momentum flips negative

export async function evaluateAndAct({ allPairsByChain, trader, buyUsd = 50, scoreThreshold = 60, profitTargetPct = 0.12, stopLossPct = -0.06 }) {
  // Flatten pairs across chains with chain label
  const flat = [];
  for (const [chain, pairs] of Object.entries(allPairsByChain)) {
    for (const p of pairs) flat.push({ ...p, chain });
  }

  const ranked = rankPairs(flat, 100);

  // Buy logic
  for (const entry of ranked) {
    const { pair, score, components } = entry;
    if (score < scoreThreshold) break; // ranked sorted desc
    // only buy if not already holding this pair
    const already = trader.positions.find(pos => pos.pairAddress === pair.pairAddress);
    if (already) continue;

    // Simple momentum check
    if ((pair.priceChangeH1 > 0) || (pair.priceChangeH24 > 0)) {
      if (!trader.canBuy(buyUsd)) break;
      const chainName = entry.pair?.chain || entry.chain;
      const pos = trader.buy({ pair, chain: chainName, usdSize: buyUsd });
      paperLog({ token: pair.baseToken.symbol, chain: chainName, score, reason: `momentum h1:${pair.priceChangeH1.toFixed(2)} h24:${pair.priceChangeH24.toFixed(2)}`, action: 'BUY', price: pair.priceUsd, sizeUsd: buyUsd });
      if (!pos) break;
    }
  }

  // Sell logic: simulate scanning positions and decide to sell
  for (const pos of [...trader.positions]) {
    // Find current pair data
    const chainPairs = allPairsByChain[pos.chain] || [];
    const pair = chainPairs.find(p => p.pairAddress === pos.pairAddress);
    if (!pair) continue; // can't price

    const currentPrice = pair.priceUsd;
    const entryPrice = pos.entryPrice;
    const pct = (currentPrice - entryPrice) / entryPrice;

    // profit target or stop loss
    if (pct >= profitTargetPct || pct <= stopLossPct) {
      const trade = trader.sell(pos.id, currentPrice);
      paperLog({ token: pos.tokenSymbol, chain: pos.chain, score: scorePair(pair).score, reason: pct >= profitTargetPct ? `profit target ${pct.toFixed(2)}` : `stop loss ${pct.toFixed(2)}`, action: 'SELL', price: currentPrice, sizeUsd: pos.sizeUsd });
    }
  }

  return { rankedTop: ranked.slice(0, 10) };
}

export default { evaluateAndAct };
