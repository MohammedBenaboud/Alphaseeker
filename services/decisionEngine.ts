import { TokenData, MarketState, SignalConfidence, DecisionMetric, EnrichedTokenData } from '../types';
import { generateDecisionExplanation } from './explainability';

/**
 * MODULE 2: Decision Intelligence Engine
 * 
 * This service acts as a stateless processor that could be deployed 
 * as a Google Cloud Function triggered by Pub/Sub events from Module 1.
 */

// Thresholds for classification
const THRESHOLDS = {
  VOLATILITY_MAX: 85,
  VOLATILITY_MIN: 20,
  VOLUME_SPIKE_ACCUMULATION: 1.5,
  VOLUME_SPIKE_MOMENTUM: 2.5,
  PRICE_CHANGE_FLAT: 0.5, // +/- 0.5% considered flat
  PRICE_CHANGE_BREAKOUT: 3.0, // > 3% in 5m
  LIQUIDITY_DANGER: 80000,
};

const determineConfidence = (token: TokenData, state: MarketState): SignalConfidence => {
  // Simple confidence heuristic based on data strength
  if (state === MarketState.UNSTABLE) return SignalConfidence.LOW; // Fix: Unstable should be low confidence for trading
  
  const scoreStrength = token.momentumScore;
  if (scoreStrength > 80) return SignalConfidence.HIGH;
  if (scoreStrength > 50) return SignalConfidence.MEDIUM;
  return SignalConfidence.LOW;
};

export const evaluateMarketState = (token: TokenData): DecisionMetric => {
  let state = MarketState.DORMANT;
  let trigger = "Low activity detected";

  const { volatilityIndex, volumeSpikeFactor, priceChange, liquidity } = token;
  const absPriceChangeM5 = Math.abs(priceChange.m5);

  // 1. Check for Instability first (Risk Management Layer)
  if (volatilityIndex > THRESHOLDS.VOLATILITY_MAX || liquidity < THRESHOLDS.LIQUIDITY_DANGER) {
    state = MarketState.UNSTABLE;
    trigger = volatilityIndex > THRESHOLDS.VOLATILITY_MAX ? "Extreme Volatility" : "Liquidity Crunch";
  }
  // 2. Check for Overextension (Reversal Risk)
  else if (priceChange.h1 > 15 && volumeSpikeFactor < 0.8) {
    state = MarketState.OVEREXTENDED;
    trigger = "Price/Volume Divergence";
  }
  // 3. Check for Momentum (Breakout)
  else if (volumeSpikeFactor > THRESHOLDS.VOLUME_SPIKE_MOMENTUM && priceChange.m5 > 2.0) {
    state = MarketState.MOMENTUM;
    trigger = "Volume-backed Breakout";
  }
  // 4. Check for Accumulation (The "Hidden Gem" signal)
  // High volume but price is being suppressed/held flat
  else if (volumeSpikeFactor > THRESHOLDS.VOLUME_SPIKE_ACCUMULATION && absPriceChangeM5 < THRESHOLDS.PRICE_CHANGE_FLAT) {
    state = MarketState.ACCUMULATION;
    trigger = "High Vol / Low Price Delta";
  }
  // 5. Dormant State
  else if (volumeSpikeFactor < 0.5 && volatilityIndex < THRESHOLDS.VOLATILITY_MIN) {
    state = MarketState.DORMANT;
    trigger = "Inactive";
  } 
  // Default fallthrough (often falls into early momentum or noise)
  else if (token.momentumScore > 40) {
     // If it has decent score but doesn't fit strict categories, usually early momentum
     state = MarketState.MOMENTUM;
     trigger = "Score-based activity";
  }

  return {
    state,
    confidence: determineConfidence(token, state),
    triggerEvent: trigger,
    lastTransition: Date.now()
  };
};

export const processDecisions = (tokens: TokenData[]): EnrichedTokenData[] => {
  return tokens.map(t => {
    const decision = evaluateMarketState(t);
    // Explainability Layer Integration
    const explanation = generateDecisionExplanation(t, decision);
    
    return {
      ...t,
      decision,
      explanation
    };
  });
};