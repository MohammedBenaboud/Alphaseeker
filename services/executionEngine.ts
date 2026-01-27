import { EnrichedTokenData, PortfolioPosition, ExecutionLog, ExecutionType } from '../types';
import { evaluateRisk, evaluateExit } from './riskGovernor';

/**
 * MODULE 3: Execution Engine
 * 
 * Manages the loop of checking signals against risk rules and generating mock orders.
 */

interface ExecutionResult {
  updatedPortfolio: PortfolioPosition[];
  newLogs: ExecutionLog[];
}

export const processExecutionCycle = (
  tokens: EnrichedTokenData[],
  currentPortfolio: PortfolioPosition[],
  lastExecutionTime: number
): ExecutionResult => {
  const newLogs: ExecutionLog[] = [];
  let updatedPortfolio = [...currentPortfolio];
  
  // 1. Process EXITS first (Risk reduction priority)
  for (const position of currentPortfolio) {
    const liveToken = tokens.find(t => t.id === position.tokenId);
    if (liveToken) {
      const exitDecision = evaluateExit(liveToken, position);
      
      if (exitDecision.allowed) {
        newLogs.push({
          id: `exec-${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
          symbol: position.symbol,
          type: ExecutionType.EXIT,
          sizeUsd: position.sizeUsd,
          reason: exitDecision.reason,
          riskCheck: "PASS: Exit condition met"
        });
        
        // Remove from portfolio
        updatedPortfolio = updatedPortfolio.filter(p => p.tokenId !== position.tokenId);
      }
    }
  }

  // 2. Process ENTRIES
  // Sort candidates by score to prioritize best signals
  const candidates = tokens
    .filter(t => !updatedPortfolio.find(p => p.tokenId === t.id))
    .sort((a, b) => b.momentumScore - a.momentumScore);

  for (const candidate of candidates) {
    // Only attempt one entry per cycle to respect cooldowns usually
    // But we check risk governor for each
    const riskAssessment = evaluateRisk(candidate, updatedPortfolio, lastExecutionTime);

    if (riskAssessment.allowed) {
      newLogs.push({
        id: `exec-${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        symbol: candidate.symbol,
        type: ExecutionType.ENTRY,
        sizeUsd: riskAssessment.adjustedSize,
        reason: candidate.decision.triggerEvent,
        riskCheck: riskAssessment.reason
      });

      updatedPortfolio.push({
        tokenId: candidate.id,
        symbol: candidate.symbol,
        entryPrice: candidate.price,
        sizeUsd: riskAssessment.adjustedSize,
        entryTime: Date.now(),
        unrealizedPnl: 0
      });
      
      // Stop after one entry to enforce cycle cooldown logic in main loop
      break; 
    } else {
        // Log rejections for high score items only to reduce noise
        if (candidate.momentumScore > 80) {
             newLogs.push({
                id: `rej-${Date.now()}-${Math.random()}`,
                timestamp: Date.now(),
                symbol: candidate.symbol,
                type: ExecutionType.REJECTED,
                sizeUsd: 0,
                reason: candidate.decision.triggerEvent,
                riskCheck: riskAssessment.reason
            });
        }
    }
  }

  return { updatedPortfolio, newLogs };
};

export const updatePortfolioPnl = (portfolio: PortfolioPosition[], tokens: EnrichedTokenData[]): PortfolioPosition[] => {
    return portfolio.map(pos => {
        const token = tokens.find(t => t.id === pos.tokenId);
        if (!token) return pos;
        
        const priceDiff = token.price - pos.entryPrice;
        const pnlPct = priceDiff / pos.entryPrice;
        const pnlUsd = pos.sizeUsd * pnlPct;
        
        return {
            ...pos,
            unrealizedPnl: pnlUsd
        };
    });
};