import { 
    SystemMetric, 
    SystemAlert, 
    OptimizationEvent, 
    GlobalSystemConfig,
    AutoTunerState,
    ExecutionLog,
    ExecutionType
} from '../types';

/**
 * MODULE 4: Optimization Controller
 * 
 * Philosophy: "Stability over Reactivity"
 * 
 * Constraints:
 * 1. Max 2 adjustments per 24h
 * 2. Min observation window: 50 signals or 24h
 * 3. Gradual step-based updates (no jumps)
 */

const CONSTANTS = {
    WINDOW_SIZE_SIGNALS: 50,
    WINDOW_SIZE_MS: 24 * 60 * 60 * 1000, // 24 Hours
    MAX_ADJUSTMENTS_PER_DAY: 2,
    MIN_ACCURACY_TARGET: 65, // %
    MAX_ACCURACY_CEILING: 85, // % (If higher, we might be too strict)
    STEP_LIQUIDITY: 5000,
    STEP_VOLATILITY: 2,
    STEP_COOLDOWN: 15
};

export const initializeTunerState = (): AutoTunerState => ({
    lastAdjustmentTime: 0,
    adjustmentsToday: 0,
    windowStartTime: Date.now(),
    signalsProcessedInWindow: 0,
    rollingAccuracy: []
});

export const monitorSystemHealth = (
    logs: ExecutionLog[], 
    currentLatency: number,
    tunerState: AutoTunerState
): { metrics: SystemMetric, alerts: SystemAlert[] } => {
    
    // Calculate Error Rate (Rejected executions / Total attempts) in recent history
    const recentLogs = logs.slice(0, 50);
    const rejections = recentLogs.filter(l => l.type === ExecutionType.REJECTED).length;
    const totalOps = recentLogs.length || 1;
    const errorRate = (rejections / totalOps) * 100;

    // Calculate Rolling Accuracy from Tuner State (Persistent source of truth)
    const accWindow = tunerState.rollingAccuracy.slice(-50); // Last 50 outcomes
    const wins = accWindow.filter(x => x === 1).length;
    const signalAccuracy = accWindow.length > 0 ? (wins / accWindow.length) * 100 : 0;

    const metrics: SystemMetric = {
        timestamp: Date.now(),
        latencyMs: currentLatency,
        errorRate,
        signalAccuracy,
        activeModules: 5
    };

    const alerts: SystemAlert[] = [];
    if (tunerState.adjustmentsToday >= CONSTANTS.MAX_ADJUSTMENTS_PER_DAY) {
        alerts.push({
            id: `alert-${Date.now()}-limit`,
            timestamp: Date.now(),
            severity: 'INFO',
            module: 'OPTIMIZER',
            message: 'Daily optimization limit reached. Tuning frozen.'
        });
    }

    return { metrics, alerts };
};

// Called whenever a "Trade" completes (simulated or real)
export const ingestSignalOutcome = (
    state: AutoTunerState, 
    isWin: boolean
): AutoTunerState => {
    const newState = { ...state };
    newState.signalsProcessedInWindow += 1;
    newState.rollingAccuracy = [...state.rollingAccuracy, isWin ? 1 : 0].slice(-100); // Keep last 100
    return newState;
};

export const runConservativeOptimization = (
    currentConfig: GlobalSystemConfig,
    metrics: SystemMetric,
    tunerState: AutoTunerState
): { newConfig: GlobalSystemConfig, optimization: OptimizationEvent | null, newState: AutoTunerState } => {
    
    const now = Date.now();
    let newState = { ...tunerState };
    const newConfig = JSON.parse(JSON.stringify(currentConfig)) as GlobalSystemConfig;
    let optimization: OptimizationEvent | null = null;

    // 1. Check Constraints
    // Reset daily counter if 24h passed
    if (now - newState.windowStartTime > CONSTANTS.WINDOW_SIZE_MS) {
        newState.adjustmentsToday = 0;
        newState.windowStartTime = now;
        newState.signalsProcessedInWindow = 0; // Reset signal window too if time based reset happens
    }

    // Hard Stop: Max adjustments reached
    if (newState.adjustmentsToday >= CONSTANTS.MAX_ADJUSTMENTS_PER_DAY) {
        return { newConfig, optimization, newState };
    }

    // Observation Window Check
    const windowComplete = newState.signalsProcessedInWindow >= CONSTANTS.WINDOW_SIZE_SIGNALS;
    
    // Only optimize if window is full OR (emergency logic could go here)
    if (!windowComplete) {
        return { newConfig, optimization, newState };
    }

    // 2. Optimization Logic
    const currentAcc = metrics.signalAccuracy;

    // SCENARIO A: Accuracy Too Low (Tighten Standards)
    if (currentAcc < CONSTANTS.MIN_ACCURACY_TARGET && newState.signalsProcessedInWindow > 0) {
        // Preference: Increase Liquidity Filter first (removes garbage)
        if (newConfig.scoring.minLiquidity < 200000) {
            const oldVal = newConfig.scoring.minLiquidity;
            newConfig.scoring.minLiquidity += CONSTANTS.STEP_LIQUIDITY;
            
            optimization = {
                id: `opt-${now}`,
                timestamp: now,
                targetModule: 'SCORING',
                parameter: 'minLiquidity',
                oldValue: oldVal,
                newValue: newConfig.scoring.minLiquidity,
                reason: `Accuracy (${currentAcc.toFixed(1)}%) below target. Tightening liquidity filter.`
            };
        } 
        // Fallback: Tighten Volatility
        else {
             const oldVal = newConfig.risk.volatilityKillSwitch;
             newConfig.risk.volatilityKillSwitch = Math.max(50, oldVal - CONSTANTS.STEP_VOLATILITY);
             
             optimization = {
                id: `opt-${now}`,
                timestamp: now,
                targetModule: 'RISK',
                parameter: 'volatilityKillSwitch',
                oldValue: oldVal,
                newValue: newConfig.risk.volatilityKillSwitch,
                reason: `Accuracy low. Reducing volatility tolerance.`
            };
        }
    }

    // SCENARIO B: Accuracy Very High (Loosen to capture more opportunity)
    // Only if we have processed A LOT of signals to be sure
    else if (currentAcc > CONSTANTS.MAX_ACCURACY_CEILING && newState.signalsProcessedInWindow > CONSTANTS.WINDOW_SIZE_SIGNALS) {
         if (newConfig.risk.cooldownSeconds > 30) {
            const oldVal = newConfig.risk.cooldownSeconds;
            newConfig.risk.cooldownSeconds -= CONSTANTS.STEP_COOLDOWN;

            optimization = {
                id: `opt-${now}`,
                timestamp: now,
                targetModule: 'RISK',
                parameter: 'cooldownSeconds',
                oldValue: oldVal,
                newValue: newConfig.risk.cooldownSeconds,
                reason: `Accuracy high (${currentAcc.toFixed(1)}%). Reducing cooldown to capture more flow.`
            };
         }
    }

    // 3. Finalize
    if (optimization) {
        newState.adjustmentsToday += 1;
        newState.signalsProcessedInWindow = 0; // Reset window after action to observe effect
        newState.lastAdjustmentTime = now;
    }

    return { newConfig, optimization, newState };
};