import { fetchAllSupportedChains } from './dataFetcher.js';
import PaperTrader from './paperTrader.js';
import { evaluateAndAct } from './strategy.js';
import { info } from './logger.js';

const POLL_INTERVAL_MS = Number(process.env.BOT_INTERVAL_MS || 60_000);
const STARTING_USD = Number(process.env.START_USD || 1000);

async function main() {
  console.log('\n===== ALPHASEEKER PAPER TRADER (LIVE PRICES) =====');
  console.log('PAPER TRADE MODE — NO KEYS, NO WALLETS, NO REAL TRADES');
  console.log(`Starting USD balance: ${STARTING_USD}`);

  const trader = new PaperTrader({ startingUsd: STARTING_USD });

  // Continuous loop
  // Strategy configuration from env
  const buyUsd = Number(process.env.BUY_USD || 50);
  const scoreThreshold = Number(process.env.SCORE_THRESHOLD || 60);
  const profitTargetPct = Number(process.env.PROFIT_TARGET_PCT || 0.12);
  const stopLossPct = Number(process.env.STOP_LOSS_PCT || -0.06);

  const maxIter = Number(process.env.MAX_ITERATIONS || 0);
  let iter = 0;

  while (true) {
    if (maxIter > 0 && iter >= maxIter) {
      info('Reached MAX_ITERATIONS, exiting loop');
      break;
    }
    try {
        let all;
        if (process.env.USE_SAMPLE === '1') {
          // use local sample pairs for offline testing
          const sample = await import('./sample_pairs.json', { assert: { type: 'json' } }).then(m => m.default || m);
          all = sample;
        } else {
          all = await fetchAllSupportedChains();
        }
      // each value is an array of normalized pairs
      await evaluateAndAct({ allPairsByChain: all, trader, buyUsd, scoreThreshold, profitTargetPct, stopLossPct });

      // report summary
      const summary = trader.summary();
      info('Summary:', summary);
    } catch (err) {
      console.error('Run error', err && err.stack ? err.stack : err);
    }

    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
    iter += 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('runBot.js')) {
  main();
}

export default main;
