import { SimulationTrade, ValidationMetric, ValidationInsight, MarketState, SignalConfidence } from '../types';

/**
 * MODULE 5: Simulation & Validation Service
 * 
 * Responsibility: Generate retrospective analysis of system performance.
 * Since this is a client-side demo, we generate "Mock History" to visualize 
 * how the system would report on long-term data.
 */

const STATES = Object.values(MarketState);
const CONFIDENCES = Object.values(SignalConfidence);

// 1. Generate Mock Historical Trades for Visualization
export const generateMockHistory = (count: number = 100): SimulationTrade[] => {
    const trades: SimulationTrade[] = [];
    const now = Date.now();

    for (let i = 0; i < count; i++) {
        // Randomly assign state and confidence
        const state = STATES[Math.floor(Math.random() * STATES.length)];
        const confidence = CONFIDENCES[Math.floor(Math.random() * CONFIDENCES.length)];
        
        // Simulate Outcome Bias based on "Bot Logic"
        // (High Confidence + Momentum should have better win rate)
        let winProb = 0.4; // Base 40%
        if (state === MarketState.MOMENTUM) winProb += 0.2;
        if (state === MarketState.ACCUMULATION) winProb += 0.1;
        if (confidence === SignalConfidence.HIGH) winProb += 0.2;
        if (state === MarketState.UNSTABLE) winProb -= 0.3;

        const rand = Math.random();
        let outcome: 'WIN' | 'LOSS' | 'NEUTRAL' = 'NEUTRAL';
        let percentChange = (Math.random() * 2) - 1; // -1% to +1% noise

        if (rand < winProb) {
            outcome = 'WIN';
            percentChange = (Math.random() * 15) + 2; // +2% to +17%
        } else if (rand > 0.9) {
            outcome = 'NEUTRAL'; // 10% chance of chop
            percentChange = (Math.random() * 1.5) - 0.75;
        } else {
            outcome = 'LOSS';
            percentChange = (Math.random() * -10) - 2; // -2% to -12%
        }

        trades.push({
            id: `sim-${i}`,
            symbol: `MOCK-${Math.floor(Math.random() * 999)}`,
            entryTime: now - (i * 3600000), // Hourly intervals back
            exitTime: now - (i * 3600000) + 1800000, // 30m later
            entryPrice: 100,
            exitPrice: 100 * (1 + (percentChange / 100)),
            marketState: state,
            confidence: confidence,
            outcome,
            percentChange
        });
    }
    return trades;
};

// 2. Analyze Performance by Category
export const analyzeValidationMetrics = (trades: SimulationTrade[]): ValidationMetric[] => {
    const metrics: ValidationMetric[] = [];

    // Analyze by State
    STATES.forEach(state => {
        const subset = trades.filter(t => t.marketState === state);
        if (subset.length === 0) return;

        const wins = subset.filter(t => t.outcome === 'WIN').length;
        const neutrals = subset.filter(t => t.outcome === 'NEUTRAL').length;
        
        // Sum percentage returns
        const totalReturn = subset.reduce((acc, curr) => acc + curr.percentChange, 0);

        metrics.push({
            category: `State: ${state}`,
            totalSignals: subset.length,
            accuracy: (wins / subset.length) * 100,
            avgReturn: totalReturn / subset.length,
            noiseRatio: (neutrals / subset.length) * 100
        });
    });

    // Analyze by Confidence
    CONFIDENCES.forEach(conf => {
        const subset = trades.filter(t => t.confidence === conf);
        if (subset.length === 0) return;
        
        const wins = subset.filter(t => t.outcome === 'WIN').length;
        const neutrals = subset.filter(t => t.outcome === 'NEUTRAL').length;
        const totalReturn = subset.reduce((acc, curr) => acc + curr.percentChange, 0);

        metrics.push({
            category: `Conf: ${conf}`,
            totalSignals: subset.length,
            accuracy: (wins / subset.length) * 100,
            avgReturn: totalReturn / subset.length,
            noiseRatio: (neutrals / subset.length) * 100
        });
    });

    return metrics;
};

// 3. Generate Automated Insights
export const generateInsights = (metrics: ValidationMetric[]): ValidationInsight[] => {
    const insights: ValidationInsight[] = [];

    // Check for "Unstable" overfitting
    const unstableMetric = metrics.find(m => m.category.includes('UNSTABLE'));
    if (unstableMetric && unstableMetric.accuracy < 30) {
        insights.push({
            type: 'WARNING',
            message: 'UNSTABLE state accuracy is critically low (<30%).',
            actionableItem: 'Suggestion: Increase Volatility Penalty in Scoring Engine.'
        });
    }

    // Check for "High Confidence" validation
    const highConf = metrics.find(m => m.category.includes('HIGH'));
    if (highConf) {
        if (highConf.accuracy > 70) {
            insights.push({
                type: 'SUCCESS',
                message: 'High Confidence signals are validating correctly (>70% accuracy).',
                actionableItem: 'System is robust. Consider increasing position size.'
            });
        } else {
             insights.push({
                type: 'RECOMMENDATION',
                message: `High Confidence accuracy is only ${highConf.accuracy.toFixed(1)}%.`,
                actionableItem: 'Suggestion: Tighten volume spike thresholds in Decision Engine.'
            });
        }
    }

    // Check for Noise
    const noisyState = metrics.find(m => m.noiseRatio > 40);
    if (noisyState) {
        insights.push({
            type: 'RECOMMENDATION',
            message: `${noisyState.category} has high noise ratio (>40% neutral).`,
            actionableItem: 'Suggestion: Increase minimum liquidity filter to reduce chop.'
        });
    }

    return insights;
};