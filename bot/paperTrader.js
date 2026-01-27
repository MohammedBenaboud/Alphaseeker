import { info } from './logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TRADES_JSON = path.join(__dirname, 'trades.json');
const TRADES_CSV = path.join(__dirname, 'trades.csv');

function ensureFiles() {
  try {
    if (!fs.existsSync(TRADES_JSON)) fs.writeFileSync(TRADES_JSON, '[]');
    if (!fs.existsSync(TRADES_CSV)) fs.writeFileSync(TRADES_CSV, 'id,pairAddress,tokenSymbol,chain,entryPrice,exitPrice,entryTime,exitTime,sizeUsd,proceeds,pnl\n');
  } catch (e) {
    // ignore file errors but log
    info('Could not ensure trade files', e && e.message);
  }
}

function appendTradeToFiles(trade) {
  try {
    ensureFiles();
    const existing = JSON.parse(fs.readFileSync(TRADES_JSON, 'utf8') || '[]');
    existing.push(trade);
    fs.writeFileSync(TRADES_JSON, JSON.stringify(existing, null, 2));

    // Append CSV row
    const cols = [trade.id, trade.pairAddress, trade.tokenSymbol, trade.chain, trade.entryPrice, trade.exitPrice || '', trade.entryTime, trade.exitTime || '', trade.sizeUsd, trade.proceeds || '', trade.pnl || ''];
    fs.appendFileSync(TRADES_CSV, cols.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',') + '\n');
  } catch (e) {
    info('Failed to append trade to files', e && e.message);
  }
}

export class PaperTrader {
  constructor({ startingUsd = 1000 } = {}) {
    this.startingUsd = startingUsd;
    this.cash = startingUsd;
    this.positions = []; // { id, pairAddress, tokenSymbol, chain, entryPrice, sizeUsd, sizeBase, entryTime }
    this.tradeHistory = [];
  }

  canBuy(sizeUsd) {
    return this.cash >= sizeUsd && sizeUsd > 0;
  }

  buy({ pair, chain, usdSize }) {
    if (!this.canBuy(usdSize)) return null;
    const price = Number(pair.priceUsd || 0);
    const baseAmount = usdSize / price;
    const pos = {
      id: `pos-${Date.now()}-${Math.floor(Math.random()*10000)}`,
      pairAddress: pair.pairAddress,
      tokenSymbol: pair.baseToken.symbol,
      chain,
      entryPrice: price,
      sizeUsd: usdSize,
      sizeBase: baseAmount,
      entryTime: Date.now()
    };
    this.positions.push(pos);
    this.cash -= usdSize;
    info('PaperTrader BUY', pos.tokenSymbol, 'chain', chain, 'USD', usdSize, 'price', price);
    return pos;
  }

  sell(positionId, exitPrice) {
    const idx = this.positions.findIndex(p => p.id === positionId);
    if (idx === -1) return null;
    const pos = this.positions[idx];
    // compute exit proceeds
    const proceeds = pos.sizeBase * exitPrice;
    const pnl = proceeds - pos.sizeUsd;
    const trade = {
      ...pos,
      exitPrice,
      exitTime: Date.now(),
      proceeds,
      pnl
    };
    this.tradeHistory.push(trade);
    // persist
    try { appendTradeToFiles(trade); } catch (e) { /* ignore */ }
    this.positions.splice(idx, 1);
    this.cash += proceeds;
    info('PaperTrader SELL', pos.tokenSymbol, 'pnl', pnl.toFixed(2));
    return trade;
  }

  // Force-mark-to-market update (for reporting only)
  markToMarket(currentPrices) {
    // currentPrices: map pairAddress -> priceUsd
    return this.positions.map(p => {
      const pPrice = currentPrices[p.pairAddress] ?? p.entryPrice;
      const unrealized = (p.sizeBase * pPrice) - p.sizeUsd;
      return { ...p, currentPrice: pPrice, unrealizedPnl: unrealized };
    });
  }

  summary() {
    const realizedPnL = this.tradeHistory.reduce((s, t) => s + (t.pnl || 0), 0);
    const wins = this.tradeHistory.filter(t => t.pnl > 0).length;
    const losses = this.tradeHistory.filter(t => t.pnl <= 0).length;
    const winRate = this.tradeHistory.length ? (wins / this.tradeHistory.length) : 0;
    return {
      startingUsd: this.startingUsd,
      cash: this.cash,
      positions: this.positions.length,
      openExposureUsd: this.positions.reduce((s, p) => s + p.sizeUsd, 0),
      realizedPnL,
      trades: this.tradeHistory.length,
      wins,
      losses,
      winRate
    };
  }
}

export default PaperTrader;
