import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PaperTrader from './paperTrader.js';
import { evaluateAndAct } from './strategy.js';
import { info } from './logger.js';

async function runSample(iterations = 3, intervalMs = 1000) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const samplePath = path.join(__dirname, 'sample_pairs.json');
  const raw = fs.readFileSync(samplePath, 'utf8');
  const sample = JSON.parse(raw);

  const trader = new PaperTrader({ startingUsd: Number(process.env.START_USD || 1000) });
  const buyUsd = Number(process.env.BUY_USD || 50);
  const scoreThreshold = Number(process.env.SCORE_THRESHOLD || 60);
  const profitTargetPct = Number(process.env.PROFIT_TARGET_PCT || 0.12);
  const stopLossPct = Number(process.env.STOP_LOSS_PCT || -0.06);

  for (let i = 0; i < iterations; i++) {
    info('Sample run iteration', i+1);
    await evaluateAndAct({ allPairsByChain: sample, trader, buyUsd, scoreThreshold, profitTargetPct, stopLossPct });
    info('Summary:', trader.summary());
    await new Promise(r => setTimeout(r, intervalMs));
  }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('runSampleRun.js')) {
  const it = Number(process.argv[2] || 3);
  const iv = Number(process.argv[3] || 1000);
  runSample(it, iv).then(() => { console.log('done'); process.exit(0); }).catch(e => { console.error(e); process.exit(1); });
}

export default runSample;
