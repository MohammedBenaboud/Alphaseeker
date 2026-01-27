import React, { useState, useEffect } from 'react';
import { generateMarketSnapshot, updateTokenPrice } from './services/mockDataService';
import { fetchLiveTokenData } from './services/liveDataService';
import { processMarketBatch, calculateAlphaScore } from './services/scoringEngine';
import { processDecisions } from './services/decisionEngine';
import { processExecutionCycle, updatePortfolioPnl } from './services/executionEngine';
import { monitorSystemHealth, runConservativeOptimization, initializeTunerState, ingestSignalOutcome } from './services/optimizationService';
import { generateMarketOverview } from './services/geminiService';
import { 
    TokenData, 
    EnrichedTokenData, 
    ViewState, 
    ExecutionLog, 
    PortfolioPosition, 
    GlobalSystemConfig, 
    SystemMetric, 
    SystemAlert, 
    OptimizationEvent,
    AutoTunerState,
    ExecutionType
} from './types';
import TokenTable from './components/TokenTable';
import DetailPanel from './components/DetailPanel';
import ArchitectureView from './components/ArchitectureView';
import DecisionBoard from './components/DecisionBoard';
import ExecutionMonitor from './components/ExecutionMonitor';
import PortfolioStatus from './components/PortfolioStatus';
import SystemHealth from './components/SystemHealth';
import SimulationDashboard from './components/SimulationDashboard'; 
import { LayoutDashboard, Network, Play, Pause, RefreshCw, BrainCircuit, Activity, Server, Beaker, Globe, Database } from 'lucide-react';

const App: React.FC = () => {
  // Global System Configuration (Managed by Module 4)
  const [systemConfig, setSystemConfig] = useState<GlobalSystemConfig>({
      scoring: {
          volumeWeight: 0.35,
          momentumWeight: 0.30,
          liquidityWeight: 0.20,
          volatilityWeight: 0.15,
          minLiquidity: 50000,
      },
      risk: {
          maxOpenPositions: 3,
          basePositionSize: 1000,
          maxPortfolioRisk: 5000,
          cooldownSeconds: 60,
          volatilityKillSwitch: 90
      }
  });

  const [tokens, setTokens] = useState<EnrichedTokenData[]>([]);
  const [selectedToken, setSelectedToken] = useState<TokenData | null>(null);
  const [viewState, setViewState] = useState<ViewState>(ViewState.DASHBOARD);
  const [isPaused, setIsPaused] = useState(false);
  const [marketSentiment, setMarketSentiment] = useState<string>("");
  const [dataSource, setDataSource] = useState<'MOCK' | 'LIVE'>('MOCK');

  // Module 3 State
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioPosition[]>([]);
  const [lastExecutionTime, setLastExecutionTime] = useState<number>(0);

  // Module 4 State
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [optimizations, setOptimizations] = useState<OptimizationEvent[]>([]);
  const [tunerState, setTunerState] = useState<AutoTunerState>(initializeTunerState());

  // Initial Load
  useEffect(() => {
    const loadInitial = async () => {
        let initialData: TokenData[] = [];
        if (dataSource === 'LIVE') {
            initialData = await fetchLiveTokenData();
        } else {
            initialData = generateMarketSnapshot();
        }
        
        const scored = processMarketBatch(initialData); 
        const enriched = processDecisions(scored);
        setTokens(enriched);
        
        generateMarketOverview(initialData).then(setMarketSentiment);
    };
    loadInitial();
  }, [dataSource]);

  // Main Event Loop
  useEffect(() => {
    if (isPaused) return;

    const tickRate = dataSource === 'LIVE' ? 5000 : 2000; // Slower tick rate for live API to avoid rate limits

    const interval = setInterval(async () => {
      const startTime = performance.now();

      // 1. Data Ingestion (Mock or Live)
      let currentBatch: TokenData[] = [];
      
      if (dataSource === 'LIVE') {
          // In live mode, we fetch fresh data. 
          // Note: In a real app, we might merge this with local state to prevent UI flicker
          const liveData = await fetchLiveTokenData();
          if (liveData.length > 0) {
              currentBatch = liveData;
          } else {
              // If live fetch fails/returns empty (e.g. rate limit), keep existing tokens
              currentBatch = tokens; 
          }
      } else {
          // In mock mode, we mutate the existing tokens slightly
          currentBatch = tokens.map(t => Math.random() > 0.6 ? updateTokenPrice(t) : t);
      }

      // 2. Module 1: Scoring Pipeline
      const scored = currentBatch.map(t => ({
          ...t,
          momentumScore: calculateAlphaScore(t, systemConfig.scoring) 
      })).sort((a, b) => b.momentumScore - a.momentumScore);

      // 3. Module 2: Decision Intelligence
      const enriched = processDecisions(scored);
      setTokens(enriched);
      
      // 3.5 Update Portfolio PnL based on new prices
      setPortfolio(prevPortfolio => updatePortfolioPnl(prevPortfolio, enriched));

      // Measure Latency
      const latency = performance.now() - startTime;

      // 4. Module 4: Observability & Optimization Loop
      const healthCheck = monitorSystemHealth(executionLogs, latency, tunerState);
      
      setSystemMetrics(prev => [...prev, healthCheck.metrics].slice(-50)); 
      if (healthCheck.alerts.length > 0) {
          setSystemAlerts(prev => [...prev, ...healthCheck.alerts].slice(-20));
      }

      const optResult = runConservativeOptimization(systemConfig, healthCheck.metrics, tunerState);
      
      setTunerState(optResult.newState);

      if (optResult.optimization) {
          setSystemConfig(optResult.newConfig);
          setOptimizations(prev => [...prev, optResult.optimization!]);
      }

    }, tickRate); 

    return () => clearInterval(interval);
  }, [isPaused, executionLogs, portfolio, systemConfig, tunerState, dataSource, tokens]); 

  // Separate Loop for Execution Engine (Module 3)
  useEffect(() => {
    if (isPaused || tokens.length === 0) return;

    const { updatedPortfolio, newLogs } = processExecutionCycle(tokens, portfolio, lastExecutionTime);
    
    if (newLogs.length > 0) {
        setExecutionLogs(prev => [...newLogs, ...prev].slice(0, 100));
        
        const hasAction = newLogs.some(l => l.type !== 'REJECTED');
        if (hasAction) {
             setPortfolio(updatedPortfolio);
             setLastExecutionTime(Date.now());
        }
    }
  }, [tokens, isPaused]); 
  
  // Mock Signal Injection (Only in MOCK mode)
  useEffect(() => {
      if(!isPaused && dataSource === 'MOCK' && Math.random() > 0.9) {
          const mockWin = Math.random() > 0.4; 
          setTunerState(prev => ingestSignalOutcome(prev, mockWin));
      }
  }, [isPaused, dataSource]);


  // Keep selected token object in sync
  useEffect(() => {
    if (selectedToken) {
      const fresh = tokens.find(t => t.id === selectedToken.id);
      if (fresh) setSelectedToken(fresh);
    }
  }, [tokens, selectedToken?.id]);

  const handleManualRefresh = async () => {
    if (dataSource === 'LIVE') {
        const data = await fetchLiveTokenData();
        const scored = processMarketBatch(data);
        setTokens(processDecisions(scored));
    } else {
        const data = generateMarketSnapshot();
        const scored = processMarketBatch(data);
        setTokens(processDecisions(scored));
    }
  };

  return (
    <div className="flex h-screen bg-background text-slate-100 font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-700 flex flex-col">
        <div className="p-6">
            <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent tracking-tight">
                ALPHA SEEKER
            </h1>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Quant System v5.0</div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
            <div className="text-xs font-semibold text-slate-600 uppercase px-4 mb-2 mt-4">Pipeline</div>
            <button 
                onClick={() => setViewState(ViewState.DASHBOARD)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${viewState === ViewState.DASHBOARD ? 'bg-primary/10 text-primary border border-primary/20' : 'text-slate-400 hover:bg-slate-800'}`}
            >
                <LayoutDashboard size={18} />
                Raw Scanner
            </button>

            <button 
                onClick={() => setViewState(ViewState.DECISION_ENGINE)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${viewState === ViewState.DECISION_ENGINE ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:bg-slate-800'}`}
            >
                <BrainCircuit size={18} />
                Decision Board
            </button>

            <button 
                onClick={() => setViewState(ViewState.EXECUTION)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${viewState === ViewState.EXECUTION ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:bg-slate-800'}`}
            >
                <Activity size={18} />
                Execution Monitor
            </button>

            <div className="text-xs font-semibold text-slate-600 uppercase px-4 mb-2 mt-4">Validation</div>
            <button 
                onClick={() => setViewState(ViewState.SYSTEM_HEALTH)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${viewState === ViewState.SYSTEM_HEALTH ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'text-slate-400 hover:bg-slate-800'}`}
            >
                <Server size={18} />
                System Health
            </button>
            <button 
                onClick={() => setViewState(ViewState.SIMULATION)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${viewState === ViewState.SIMULATION ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20' : 'text-slate-400 hover:bg-slate-800'}`}
            >
                <Beaker size={18} />
                Simulation Lab
            </button>

            <div className="text-xs font-semibold text-slate-600 uppercase px-4 mb-2 mt-4">System</div>
            <button 
                onClick={() => setViewState(ViewState.ARCHITECTURE)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${viewState === ViewState.ARCHITECTURE ? 'bg-primary/10 text-primary border border-primary/20' : 'text-slate-400 hover:bg-slate-800'}`}
            >
                <Network size={18} />
                Architecture
            </button>
        </nav>

        <div className="p-6 border-t border-slate-800">
            <div className="text-xs text-slate-500 mb-2">System Status</div>
            <div className="flex items-center gap-2 text-green-400 text-sm font-bold">
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 ${isPaused ? 'hidden' : ''}`}></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                {isPaused ? 'PAUSED' : 'OPTIMIZING'}
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Bar */}
        <header className="h-16 bg-slate-900/50 border-b border-slate-700 flex items-center justify-between px-6 backdrop-blur-sm">
            <div className="flex items-center gap-4 text-sm text-slate-400">
                <span>View: <strong className="text-white">
                    {viewState === ViewState.DASHBOARD && 'Raw Data Feed'}
                    {viewState === ViewState.DECISION_ENGINE && 'Signal Intelligence'}
                    {viewState === ViewState.EXECUTION && 'Risk & Execution'}
                    {viewState === ViewState.SYSTEM_HEALTH && 'Observability'}
                    {viewState === ViewState.SIMULATION && 'Simulation & Validation'}
                    {viewState === ViewState.ARCHITECTURE && 'System Diagram'}
                </strong></span>
                <span className="h-4 w-px bg-slate-700"></span>
                <span className="truncate max-w-md italic opacity-70">
                    "{marketSentiment || 'Calibrating market sensors...'}"
                </span>
            </div>
            
            <div className="flex items-center gap-3">
                {/* Source Toggle */}
                <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
                    <button 
                        onClick={() => setDataSource('MOCK')}
                        className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-2 ${dataSource === 'MOCK' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <Database size={12} />
                        MOCK
                    </button>
                    <button 
                        onClick={() => setDataSource('LIVE')}
                        className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-2 ${dataSource === 'LIVE' ? 'bg-red-900/50 text-red-200 border border-red-500/50 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <Globe size={12} />
                        LIVE
                    </button>
                </div>

                <div className="h-6 w-px bg-slate-700 mx-1"></div>

                <button 
                    onClick={() => setIsPaused(!isPaused)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
                    title={isPaused ? "Resume Feed" : "Pause Feed"}
                >
                    {isPaused ? <Play size={18} /> : <Pause size={18} />}
                </button>
                <button 
                    onClick={handleManualRefresh}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
                    title="Force Refresh Data"
                >
                    <RefreshCw size={18} />
                </button>
            </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 flex overflow-hidden relative">
            
            {viewState === ViewState.DASHBOARD && (
                <>
                    <div className="flex-1 overflow-y-auto">
                        <TokenTable 
                            tokens={tokens} 
                            onSelectToken={setSelectedToken}
                            selectedTokenId={selectedToken?.id} 
                        />
                    </div>
                    <div className="w-96 h-full shrink-0 shadow-xl z-10 border-l border-slate-700">
                        <DetailPanel token={selectedToken as EnrichedTokenData} />
                    </div>
                </>
            )}

            {viewState === ViewState.DECISION_ENGINE && (
                <div className="flex-1 overflow-hidden bg-background">
                    <DecisionBoard tokens={tokens} />
                </div>
            )}

            {viewState === ViewState.EXECUTION && (
                <div className="flex-1 flex overflow-hidden">
                     <div className="flex-1 overflow-hidden">
                        <ExecutionMonitor logs={executionLogs} />
                     </div>
                     <div className="w-80 border-l border-slate-700 bg-slate-900/50">
                        <PortfolioStatus portfolio={portfolio} />
                     </div>
                </div>
            )}

            {viewState === ViewState.SYSTEM_HEALTH && (
                <div className="flex-1 overflow-hidden">
                    <SystemHealth 
                        metrics={systemMetrics} 
                        alerts={systemAlerts} 
                        optimizations={optimizations}
                        config={systemConfig}
                    />
                </div>
            )}

            {viewState === ViewState.SIMULATION && (
                <div className="flex-1 overflow-hidden">
                    <SimulationDashboard />
                </div>
            )}

            {viewState === ViewState.ARCHITECTURE && (
                <div className="flex-1 overflow-y-auto bg-slate-900">
                    <ArchitectureView />
                </div>
            )}

        </div>
      </main>
    </div>
  );
};

export default App;