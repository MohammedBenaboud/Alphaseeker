import fs from 'fs';
import path from 'path';

const TRADES_JSON = path.resolve(new URL('.', import.meta.url).pathname, 'trades.json');

function loadTrades() {
  if (!fs.existsSync(TRADES_JSON)) return [];
  const raw = fs.readFileSync(TRADES_JSON, 'utf8');
  try { return JSON.parse(raw || '[]'); } catch (e) { return []; }
}

function summarize(trades) {
  const total = trades.length;
  const realized = trades.filter(t => typeof t.pnl === 'number');
  const realizedPnL = realized.reduce((s, t) => s + (t.pnl || 0), 0);
  const wins = realized.filter(t => (t.pnl || 0) > 0).length;
  const losses = realized.filter(t => (t.pnl || 0) <= 0).length;
  const winRate = realized.length ? (wins / realized.length) : 0;
  const avgPnL = realized.length ? (realizedPnL / realized.length) : 0;

  return { total, trades: realized.length, realizedPnL, wins, losses, winRate, avgPnL };
}

function byDay(trades) {
  const map = {};
  for (const t of trades) {
    const day = new Date(t.exitTime || t.entryTime).toISOString().slice(0,10);
    map[day] = map[day] || { trades: 0, pnl: 0, wins: 0, losses: 0 };
    map[day].trades += 1;
    map[day].pnl += (t.pnl || 0);
    if ((t.pnl || 0) > 0) map[day].wins += 1; else map[day].losses += 1;
  }
  return map;
}

function printReport() {
  const trades = loadTrades();
  const s = summarize(trades);
  console.log('TRADE SUMMARY');
  console.log('Total recorded trades:', trades.length);
  console.log('Realized trades:', s.trades);
  console.log('Realized PnL:', s.realizedPnL.toFixed(2));
  console.log('Win rate:', (s.winRate * 100).toFixed(1) + '%');
  console.log('Average PnL per trade:', s.avgPnL.toFixed(2));
  console.log('\nDaily breakdown:');
  const days = byDay(trades);
  for (const d of Object.keys(days).sort()) {
    const rec = days[d];
    console.log(d, 'trades', rec.trades, 'pnl', rec.pnl.toFixed(2), 'wins', rec.wins, 'losses', rec.losses);
  }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('analyze.js')) {
  printReport();
}

export default { printReport };
