import { EnrichedTokenData, PortfolioPosition, MarketState, SignalConfidence, RiskConfig } from '../types';

/**
 * MODULE 3: Risk Governor
 * 
 * Responsibility: Prevent catastrophic loss and enforce discipline.
 * Principle: "Survival is the highest priority."
 */

const DEFAULT_RISK_CONFIG: RiskConfig = {
  maxOpenPositions: 3,
  basePositionSize: 1000, // Mock USD
  maxPortfolioRisk: 5000,
  cooldownSeconds: 60,
  volatilityKillSwitch: 90,
};

interface RiskAssessment {
  allowed: boolean;
  adjustedSize: number;
  reason: string;
}

/**
 * Inverse Volatility Sizing
 * Higher Volatility = Smaller Size
 */
const calculateSafeSize = (token: EnrichedTokenData, baseSize: number): number => {
  // Baseline volatility is ~50. If vol is 100, size is halved.
  const volScalar = 50 / Math.max(token.volatilityIndex, 25); 
  return Math.floor(baseSize * volScalar);
};

export const evaluateRisk = (
  token: EnrichedTokenData, 
  positions: PortfolioPosition[], 
  lastActionTime: number,
  config: RiskConfig = DEFAULT_RISK_CONFIG
): RiskAssessment => {
  
  // 1. GLOBAL KILL SWITCH: Excessive Volatility
  if (token.volatilityIndex > config.volatilityKillSwitch) {
    return { allowed: false, adjustedSize: 0, reason: `Risk Governor: Volatility exceeds safety threshold (${config.volatilityKillSwitch})` };
  }

  // 2. Portfolio Saturation
  if (positions.length >= config.maxOpenPositions) {
    return { allowed: false, adjustedSize: 0, reason: "Risk Governor: Max open positions reached" };
  }

  // 3. Cooldown Check
  const timeSinceLast = (Date.now() - lastActionTime) / 1000;
  if (timeSinceLast < config.cooldownSeconds) {
    return { allowed: false, adjustedSize: 0, reason: "Risk Governor: Global execution cooldown active" };
  }

  // 4. Duplicate Check
  if (positions.find(p => p.tokenId === token.id)) {
    return { allowed: false, adjustedSize: 0, reason: "Risk Governor: Position already exists" };
  }

  // 5. Confidence Gate
  // STRICT RULE: Only High Confidence signals allowed for Entry
  if (token.decision.confidence !== SignalConfidence.HIGH) {
    return { allowed: false, adjustedSize: 0, reason: "Risk Governor: Signal confidence insufficient" };
  }

  // 6. Market State Gate
  // Only enter on fresh Momentum or Accumulation
  if (token.decision.state !== MarketState.MOMENTUM && token.decision.state !== MarketState.ACCUMULATION) {
    return { allowed: false, adjustedSize: 0, reason: `Risk Governor: State ${token.decision.state} not suitable for entry` };
  }

  // Calculate Sizing
  const safeSize = calculateSafeSize(token, config.basePositionSize);

  return {
    allowed: true,
    adjustedSize: safeSize,
    reason: `Approved: High Conf + Valid State. Vol Adj: ${(safeSize/config.basePositionSize).toFixed(2)}x`
  };
};

export const evaluateExit = (
  token: EnrichedTokenData,
  position: PortfolioPosition
): RiskAssessment => {
  // Exit Rules
  
  // 1. State Degradation (Momentum -> Overextended/Unstable)
  if (token.decision.state === MarketState.OVEREXTENDED || token.decision.state === MarketState.UNSTABLE) {
    return { allowed: true, adjustedSize: position.sizeUsd, reason: `Exit: Market State degraded to ${token.decision.state}` };
  }

  // 2. Volatility Stop
  if (token.volatilityIndex > 95) {
    return { allowed: true, adjustedSize: position.sizeUsd, reason: "Exit: Emergency volatility stop" };
  }

  return { allowed: false, adjustedSize: 0, reason: "Hold" };
};