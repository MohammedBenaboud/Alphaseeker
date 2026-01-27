import { TokenData, DecisionMetric, MarketState, TokenExplanation, SignalConfidence } from '../types';

/**
 * MODULE X: Explainability Engine
 * 
 * Objectives:
 * - Deterministic reasoning (same inputs = same explanation)
 * - Human-readable justification for system decisions
 * - Lightweight (no LLM latency)
 */

export const generateDecisionExplanation = (
    token: TokenData, 
    decision: DecisionMetric
): TokenExplanation => {
    
    const signals: string[] = [];
    const risks: string[] = [];
    let summary = "";
    let confidenceRationale = "";

    // 1. Analyze Positive Signals
    if (token.volumeSpikeFactor > 2.0) {
        signals.push(`Abnormal Volume: ${token.volumeSpikeFactor.toFixed(1)}x above average indicates institutional or viral interest.`);
    }
    if (token.liquidity > 100000) {
        signals.push(`Deep Liquidity: $${(token.liquidity/1000).toFixed(0)}k depth supports larger entries.`);
    }
    if (token.momentumScore > 80) {
        signals.push(`Strong Momentum: Scoring ${token.momentumScore}/100 based on multi-timeframe price action.`);
    }
    if (decision.state === MarketState.ACCUMULATION) {
        signals.push("Price Suppression: Volume is rising while price remains stable (Accumulation pattern).");
    }

    // 2. Analyze Risk Factors
    if (token.volatilityIndex > 80) {
        risks.push("Extreme Volatility: Asset is prone to >5% candle swings.");
    }
    if (token.liquidity < 50000) {
        risks.push("Thin Orderbook: High slippage risk on exit.");
    }
    if (decision.state === MarketState.OVEREXTENDED) {
        risks.push("Trend Exhaustion: Price extended beyond volume support.");
    }
    if (decision.state === MarketState.UNSTABLE) {
        risks.push("Metric Divergence: Signals are conflicting or erratic.");
    }

    // 3. Construct Summary
    switch (decision.state) {
        case MarketState.MOMENTUM:
            summary = `Asset classified as MOMENTUM due to confluence of volume spike (${token.volumeSpikeFactor.toFixed(1)}x) and positive price action. System detects breakout behavior.`;
            break;
        case MarketState.ACCUMULATION:
            summary = `Asset classified as ACCUMULATION. High turnover without price markup suggests smart money entry before expansion.`;
            break;
        case MarketState.DORMANT:
            summary = `Asset is DORMANT. Metrics are below activation thresholds. No significant catalyst detected.`;
            break;
        case MarketState.OVEREXTENDED:
            summary = `Asset is OVEREXTENDED. Rally appears exhausted relative to volume flow. Reversal risk is elevated.`;
            break;
        case MarketState.UNSTABLE:
            summary = `Asset is UNSTABLE. Volatility or liquidity metrics violated safety baselines.`;
            break;
        default:
            summary = `Asset state is ${decision.state}.`;
    }

    // 4. Confidence Rationale
    if (decision.confidence === SignalConfidence.HIGH) {
        confidenceRationale = "Confidence HIGH: All primary indicators (Vol, Liq, Score) align positively with no critical risk flags.";
    } else if (decision.confidence === SignalConfidence.MEDIUM) {
        confidenceRationale = `Confidence MEDIUM: Primary signal is valid, but offset by ${risks.length > 0 ? risks[0].split(':')[0] : 'lower scoring factor'}.`;
    } else {
        confidenceRationale = "Confidence LOW: Signal is weak or significant risk factors are present. Filtering advised.";
    }

    return {
        summary,
        supportingSignals: signals.slice(0, 3), // Top 3
        riskFactors: risks.slice(0, 2), // Top 2
        confidenceRationale
    };
};