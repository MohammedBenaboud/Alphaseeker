import React, { useState, useEffect } from 'react';
import { SimulationTrade, ValidationMetric, ValidationInsight } from '../types';
import { generateMockHistory, analyzeValidationMetrics, generateInsights } from '../services/simulationService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Beaker, TrendingUp, AlertOctagon, CheckCircle2, MoreHorizontal, History } from 'lucide-react';

const SimulationDashboard: React.FC = () => {
  const [history, setHistory] = useState<SimulationTrade[]>([]);
  const [metrics, setMetrics] = useState<ValidationMetric[]>([]);
  const [insights, setInsights] = useState<ValidationInsight[]>([]);

  useEffect(() => {
    // On mount, generate fresh mock data for the simulation lab
    const mockData = generateMockHistory(150);
    setHistory(mockData);
    const calculatedMetrics = analyzeValidationMetrics(mockData);
    setMetrics(calculatedMetrics);
    setInsights(generateInsights(calculatedMetrics));
  }, []);

  // Prepare chart data (Distribution of returns)
  const distributionData = history.reduce((acc, trade) => {
      const bucket = Math.floor(trade.percentChange);
      const key = bucket >= 0 ? `+${bucket}%` : `${bucket}%`;
      const existing = acc.find(a => a.range === key);
      if (existing) {
          existing.count++;
      } else {
          acc.push({ range: key, count: 1, val: bucket });
      }
      return acc;
  }, [] as { range: string, count: number, val: number }[]).sort((a, b) => a.val - b.val);

  return (
    <div className="h-full bg-slate-950 p-6 overflow-y-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Beaker className="text-pink-500" />
                Simulation Lab (Paper Mode)
            </h2>
            <p className="text-slate-400 text-sm mt-1">
                Validating bot logic against 150 historical data points.
            </p>
        </div>
        <div className="flex gap-4 text-right">
            <div>
                <div className="text-xs text-slate-500 uppercase">Total Signals</div>
                <div className="text-xl font-mono font-bold text-white">{history.length}</div>
            </div>
            <div>
                <div className="text-xs text-slate-500 uppercase">Win Rate</div>
                <div className="text-xl font-mono font-bold text-green-400">
                    {((history.filter(h => h.outcome === 'WIN').length / history.length) * 100).toFixed(1)}%
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Performance Matrix */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* Accuracy Breakdown */}
            <div className="bg-surface p-5 rounded-lg border border-slate-700">
                <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                    <TrendingUp size={16} className="text-primary" />
                    Accuracy by Classification
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {metrics.map((m, idx) => (
                        <div key={idx} className="bg-slate-900/50 p-3 rounded border border-slate-800 flex justify-between items-center">
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase">{m.category}</div>
                                <div className="text-xs text-slate-500">{m.totalSignals} Signals | Noise: {m.noiseRatio.toFixed(0)}%</div>
                            </div>
                            <div className="text-right">
                                <div className={`text-lg font-mono font-bold ${
                                    m.accuracy > 60 ? 'text-green-400' : m.accuracy < 40 ? 'text-red-400' : 'text-yellow-400'
                                }`}>
                                    {m.accuracy.toFixed(1)}%
                                </div>
                                <div className="text-[10px] text-slate-500">Accuracy</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Outcome Distribution Chart */}
            <div className="bg-surface p-5 rounded-lg border border-slate-700 h-64 flex flex-col">
                 <h3 className="text-white font-bold text-sm mb-2">Outcome Distribution (Simulated Returns)</h3>
                 <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={distributionData}>
                            <XAxis dataKey="range" stroke="#475569" fontSize={10} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#fff' }}
                                cursor={{ fill: 'transparent' }}
                            />
                            <ReferenceLine x={0} stroke="#64748b" />
                            <Bar dataKey="count">
                                {distributionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.val >= 0 ? '#10b981' : '#ef4444'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                 </div>
            </div>

        </div>

        {/* Right Column: Insights & Recent History */}
        <div className="space-y-6">
            
            {/* Automated Insights */}
            <div className="bg-surface p-5 rounded-lg border border-slate-700">
                <h3 className="text-white font-bold text-sm mb-4">Validation Insights</h3>
                <div className="space-y-3">
                    {insights.map((insight, idx) => (
                        <div key={idx} className={`p-3 rounded border text-xs ${
                            insight.type === 'SUCCESS' ? 'bg-emerald-950/30 border-emerald-800 text-emerald-200' :
                            insight.type === 'WARNING' ? 'bg-red-950/30 border-red-800 text-red-200' :
                            'bg-blue-950/30 border-blue-800 text-blue-200'
                        }`}>
                            <div className="flex items-center gap-2 font-bold mb-1">
                                {insight.type === 'SUCCESS' && <CheckCircle2 size={14} />}
                                {insight.type === 'WARNING' && <AlertOctagon size={14} />}
                                {insight.type === 'RECOMMENDATION' && <MoreHorizontal size={14} />}
                                {insight.type}
                            </div>
                            <div className="mb-2 opacity-90">{insight.message}</div>
                            {insight.actionableItem && (
                                <div className="bg-black/20 p-2 rounded italic text-white/70">
                                    {insight.actionableItem}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Trades Log */}
            <div className="bg-surface p-5 rounded-lg border border-slate-700 flex flex-col h-80">
                <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                    <History size={16} className="text-slate-400" />
                    Simulated Trade Log
                </h3>
                <div className="overflow-y-auto space-y-2 pr-2">
                    {history.slice(0, 20).map(trade => (
                        <div key={trade.id} className="flex justify-between items-center p-2 rounded bg-slate-900/50 border border-slate-800 text-xs">
                            <div>
                                <div className="font-bold text-white">{trade.symbol}</div>
                                <div className="text-[10px] text-slate-500">{trade.marketState}</div>
                            </div>
                            <div className="text-right">
                                <div className={`font-mono font-bold ${
                                    trade.outcome === 'WIN' ? 'text-green-400' : 
                                    trade.outcome === 'LOSS' ? 'text-red-400' : 'text-slate-400'
                                }`}>
                                    {trade.percentChange > 0 ? '+' : ''}{trade.percentChange.toFixed(2)}%
                                </div>
                                <div className="text-[10px] text-slate-500">{trade.outcome}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default SimulationDashboard;