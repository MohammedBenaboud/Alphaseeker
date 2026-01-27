export interface TokenData {
  id: string;
  symbol: string;
  name: string;
  price: number;
  marketCap: number;
  volume24h: number;
  liquidity: number;
  holders: number;
  priceChange: {
    m5: number;
    h1: number;
    h24: number;
  };
  volatilityIndex: number; // 0-100
  momentumScore: number; // Calculated score 0-100
  volumeSpikeFactor: number; // Multiplier of current volume vs avg
  tags: string[];
}

export interface ScoringConfig {
  volumeWeight: number;
  liquidityWeight: number;
  momentumWeight: number;
  volatilityWeight: number;
  minLiquidity: number;
}

export interface AnalysisReport {
  tokenId: string;
  timestamp: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  summary: string;
  keyFactors: string[];
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  DECISION_ENGINE = 'DECISION_ENGINE',
  EXECUTION = 'EXECUTION',
  SYSTEM_HEALTH = 'SYSTEM_HEALTH',
  SIMULATION = 'SIMULATION',
  ARCHITECTURE = 'ARCHITECTURE',
}

// --- MODULE 2 TYPES ---

export enum MarketState {
  DORMANT = 'DORMANT',           // Low activity, sleeping
  ACCUMULATION = 'ACCUMULATION', // High vol, flat price (Smart money entering)
  MOMENTUM = 'MOMENTUM',         // High vol, price breakout
  OVEREXTENDED = 'OVEREXTENDED', // Price high, vol fading (exhaustion)
  UNSTABLE = 'UNSTABLE'          // Erratic volatility, liquidity risk
}

export enum SignalConfidence {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export interface DecisionMetric {
  state: MarketState;
  confidence: SignalConfidence;
  triggerEvent: string; // Description of why this state was picked
  lastTransition: number; // Timestamp
}

export interface TokenExplanation {
  summary: string;
  supportingSignals: string[];
  riskFactors: string[];
  confidenceRationale: string;
}

// Extension of TokenData including Module 2 decision AND Module 3 Explainability
export interface EnrichedTokenData extends TokenData {
  decision: DecisionMetric;
  explanation: TokenExplanation;
}

// --- MODULE 3 TYPES ---

export enum ExecutionType {
  ENTRY = 'ENTRY',
  EXIT = 'EXIT',
  REJECTED = 'REJECTED'
}

export interface ExecutionLog {
  id: string;
  timestamp: number;
  symbol: string;
  type: ExecutionType;
  sizeUsd: number;
  reason: string;
  riskCheck: string; // Details of risk governor decision
}

export interface PortfolioPosition {
  tokenId: string;
  symbol: string;
  entryPrice: number;
  sizeUsd: number;
  entryTime: number;
  unrealizedPnl: number;
}

export interface RiskConfig {
  maxOpenPositions: number;
  basePositionSize: number;
  maxPortfolioRisk: number; // Total exposure limit
  cooldownSeconds: number;
  volatilityKillSwitch: number; // New dynamic parameter
}

// --- MODULE 4 TYPES ---

export interface SystemMetric {
  timestamp: number;
  latencyMs: number;
  errorRate: number;
  signalAccuracy: number; // 0-100%
  activeModules: number;
}

export interface SystemAlert {
  id: string;
  timestamp: number;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  module: string;
  message: string;
}

export interface OptimizationEvent {
  id: string;
  timestamp: number;
  targetModule: 'SCORING' | 'RISK' | 'DECISION';
  parameter: string;
  oldValue: string | number;
  newValue: string | number;
  reason: string;
}

export interface AutoTunerState {
  lastAdjustmentTime: number;
  adjustmentsToday: number;
  windowStartTime: number;
  signalsProcessedInWindow: number;
  rollingAccuracy: number[]; // 1 for win, 0 for loss
}

export interface GlobalSystemConfig {
  scoring: ScoringConfig;
  risk: RiskConfig;
}

// --- MODULE 5 TYPES (SIMULATION) ---

export interface SimulationTrade {
  id: string;
  symbol: string;
  entryTime: number;
  exitTime: number;
  entryPrice: number;
  exitPrice: number;
  marketState: MarketState;
  confidence: SignalConfidence;
  outcome: 'WIN' | 'LOSS' | 'NEUTRAL'; // Neutral is < 1% movement
  percentChange: number;
}

export interface ValidationMetric {
  category: string; // e.g., "State: MOMENTUM" or "Confidence: HIGH"
  totalSignals: number;
  accuracy: number; // %
  avgReturn: number; // %
  noiseRatio: number; // % of Neutral outcomes
}

export interface ValidationInsight {
  type: 'WARNING' | 'RECOMMENDATION' | 'SUCCESS';
  message: string;
  actionableItem?: string;
}