import React from 'react';
import { SystemMetric, SystemAlert, OptimizationEvent, GlobalSystemConfig } from '../types';
import { Activity, Server, AlertTriangle, CheckCircle, RefreshCw, Cpu, Settings } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface SystemHealthProps {
  metrics: SystemMetric[];
  alerts: SystemAlert[];
  optimizations: OptimizationEvent[];
  config: GlobalSystemConfig;
}

const SystemHealth: React.FC<SystemHealthProps> = ({ metrics, alerts, optimizations, config }) => {
  const currentMetric = metrics[metrics.length - 1] || { latencyMs: 0, errorRate: 0, signalAccuracy: 0 };
  
  // Format data for chart
  const chartData = metrics.slice(-20).map((m, i) => ({
      name: i.toString(),
      accuracy: m.signalAccuracy,
      latency: m.latencyMs / 10 // scale down for visual
  }));

  return (
    <div className="h-full bg-slate-950 p-6 overflow-y-auto space-y-6">
      
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface p-4 rounded-lg border border-slate-700 relative overflow-hidden">
            <div className="flex justify-between items-start z-10 relative">
                <div>
                    <div className="text-slate-400 text-xs uppercase font-bold">Signal Accuracy</div>
                    <div className={`text-2xl font-mono font-bold ${currentMetric.signalAccuracy > 80 ? 'text-green-400' : 'text-yellow-400'}`}>
                        {currentMetric.signalAccuracy.toFixed(1)}%
                    </div>
                </div>
                <Activity className="text-slate-600" />
            </div>
            {/* Tiny bg decoration */}
            <div className="absolute -bottom-4 -right-4 text-slate-800 opacity-20">
                <Activity size={80} />
            </div>
        </div>

        <div className="bg-surface p-4 rounded-lg border border-slate-700">
             <div className="flex justify-between items-start">
                <div>
                    <div className="text-slate-400 text-xs uppercase font-bold">Sys Latency</div>
                    <div className="text-2xl font-mono font-bold text-white">
                        {currentMetric.latencyMs.toFixed(0)}ms
                    </div>
                </div>
                <Server className="text-slate-600" />
            </div>
        </div>

        <div className="bg-surface p-4 rounded-lg border border-slate-700">
             <div className="flex justify-between items-start">
                <div>
                    <div className="text-slate-400 text-xs uppercase font-bold">Error/Reject Rate</div>
                    <div className={`text-2xl font-mono font-bold ${currentMetric.errorRate > 20 ? 'text-red-400' : 'text-blue-400'}`}>
                        {currentMetric.errorRate.toFixed(1)}%
                    </div>
                </div>
                <AlertTriangle className="text-slate-600" />
            </div>
        </div>

        <div className="bg-surface p-4 rounded-lg border border-slate-700">
             <div className="flex justify-between items-start">
                <div>
                    <div className="text-slate-400 text-xs uppercase font-bold">Self-Optimizations</div>
                    <div className="text-2xl font-mono font-bold text-purple-400">
                        {optimizations.length}
                    </div>
                </div>
                <RefreshCw className="text-slate-600" />
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
        
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-surface p-4 rounded-lg border border-slate-700 flex flex-col">
            <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                <Activity size={16} className="text-primary" />
                Performance Drift Monitor
            </h3>
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#fff' }} />
                        <Area type="monotone" dataKey="accuracy" stroke="#10b981" fillOpacity={1} fill="url(#colorAcc)" strokeWidth={2} />
                        <Area type="monotone" dataKey="latency" stroke="#64748b" fill="transparent" strokeDasharray="3 3" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Current Active Config */}
        <div className="bg-surface p-4 rounded-lg border border-slate-700 overflow-y-auto font-mono text-xs">
             <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2 font-sans">
                <Settings size={16} className="text-slate-400" />
                Active Configuration
            </h3>
            <div className="space-y-4">
                <div>
                    <div className="text-slate-500 mb-1 border-b border-slate-700 pb-1">MODULE 1: SCORING</div>
                    <div className="flex justify-between py-1">
                        <span>Min Liquidity</span>
                        <span className="text-accent">${config.scoring.minLiquidity.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1">
                        <span>Vol Weight</span>
                        <span className="text-slate-300">{config.scoring.volatilityWeight}</span>
                    </div>
                </div>

                <div>
                    <div className="text-slate-500 mb-1 border-b border-slate-700 pb-1">MODULE 3: RISK GOVERNANCE</div>
                    <div className="flex justify-between py-1">
                        <span>Max Positions</span>
                        <span className="text-slate-300">{config.risk.maxOpenPositions}</span>
                    </div>
                    <div className="flex justify-between py-1">
                        <span>Cooldown</span>
                        <span className="text-orange-400">{config.risk.cooldownSeconds}s</span>
                    </div>
                     <div className="flex justify-between py-1">
                        <span>Vol Kill Switch</span>
                        <span className="text-red-400">{config.risk.volatilityKillSwitch}</span>
                    </div>
                </div>
            </div>
            
            <div className="mt-6 p-3 bg-blue-900/10 border border-blue-800/30 rounded text-blue-300">
                <div className="flex items-center gap-2 mb-1 font-bold">
                    <Cpu size={12} />
                    Auto-Tuner Active
                </div>
                System is autonomously adjusting parameters based on signal feedback loop.
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Alerts Feed */}
        <div className="bg-surface p-4 rounded-lg border border-slate-700 h-64 overflow-y-auto">
            <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2 sticky top-0 bg-surface pb-2">
                <AlertTriangle size={16} className="text-yellow-500" />
                System Alerts
            </h3>
            <div className="space-y-2">
                {alerts.length === 0 && <div className="text-slate-600 italic">No active alerts. System nominal.</div>}
                {alerts.slice().reverse().map(alert => (
                    <div key={alert.id} className={`p-3 rounded border text-xs flex gap-3 ${
                        alert.severity === 'CRITICAL' ? 'bg-red-950/30 border-red-800 text-red-200' : 
                        alert.severity === 'WARNING' ? 'bg-yellow-950/30 border-yellow-800 text-yellow-200' :
                        'bg-blue-950/30 border-blue-800 text-blue-200'
                    }`}>
                        <div className="shrink-0 font-bold w-16">{alert.severity}</div>
                        <div>
                            <div className="font-bold mb-0.5">{alert.module}</div>
                            <div>{alert.message}</div>
                        </div>
                        <div className="ml-auto text-slate-500 text-[10px]">
                            {new Date(alert.timestamp).toLocaleTimeString()}
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Optimization Log */}
        <div className="bg-surface p-4 rounded-lg border border-slate-700 h-64 overflow-y-auto">
            <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2 sticky top-0 bg-surface pb-2">
                <RefreshCw size={16} className="text-purple-500" />
                Optimization Log
            </h3>
             <div className="space-y-2">
                {optimizations.length === 0 && <div className="text-slate-600 italic">No optimizations triggered yet.</div>}
                {optimizations.slice().reverse().map(opt => (
                    <div key={opt.id} className="p-3 rounded border border-purple-500/30 bg-purple-900/10 text-xs">
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-purple-300">{opt.targetModule} MODULE</span>
                            <span className="text-slate-500">{new Date(opt.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div className="text-slate-300 mb-1">
                            Adjusted <span className="text-white font-mono">{opt.parameter}</span>: 
                            <span className="text-red-400 mx-1">{opt.oldValue}</span> 
                            → 
                            <span className="text-green-400 mx-1">{opt.newValue}</span>
                        </div>
                        <div className="text-slate-500 italic">
                            Reason: {opt.reason}
                        </div>
                    </div>
                ))}
            </div>
        </div>

      </div>

    </div>
  );
};

export default SystemHealth;