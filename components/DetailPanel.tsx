import React, { useState, useEffect } from 'react';
import { TokenData, AnalysisReport, EnrichedTokenData } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Bot, ShieldCheck, AlertOctagon, Info, Loader2, BrainCircuit, Check, AlertTriangle } from 'lucide-react';
import { analyzeToken } from '../services/geminiService';

interface DetailPanelProps {
  token: EnrichedTokenData | null;
}

const DetailPanel: React.FC<DetailPanelProps> = ({ token }) => {
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setReport(null); // Reset when token changes
  }, [token]);

  if (!token) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8 text-center border-l border-slate-700">
        <Bot size={48} className="mb-4 opacity-50" />
        <p>Select a token from the live feed to analyze metrics.</p>
      </div>
    );
  }

  const handleAIAnalysis = async () => {
    setLoading(true);
    const result = await analyzeToken(token);
    setReport(result);
    setLoading(false);
  };

  // Mock data for chart visualization
  const chartData = [
    { name: '1h', vol: token.volume24h * 0.05 },
    { name: '2h', vol: token.volume24h * 0.08 },
    { name: '3h', vol: token.volume24h * 0.04 },
    { name: '4h', vol: token.volume24h * 0.12 },
    { name: 'Now', vol: token.volume24h * 0.15 * token.volumeSpikeFactor },
  ];

  return (
    <div className="h-full border-l border-slate-700 bg-surface flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-white">{token.symbol}</h2>
            <p className="text-slate-400 text-sm">{token.name}</p>
          </div>
          <div className="text-right">
             <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Alpha Score</div>
             <div className="text-3xl font-mono font-bold text-accent">{token.momentumScore}</div>
          </div>
        </div>
        
        <div className="flex gap-2 mt-4">
           {token.tags.map(tag => (
               <span key={tag} className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded border border-slate-600">
                   {tag}
               </span>
           ))}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 p-6 border-b border-slate-700">
        <div>
            <div className="text-xs text-slate-500">Liquidity Depth</div>
            <div className="text-lg font-mono text-white">${token.liquidity.toLocaleString()}</div>
        </div>
        <div>
            <div className="text-xs text-slate-500">Holders</div>
            <div className="text-lg font-mono text-white">{token.holders.toLocaleString()}</div>
        </div>
        <div>
            <div className="text-xs text-slate-500">Volatility (VI)</div>
            <div className="text-lg font-mono text-white">{token.volatilityIndex.toFixed(1)}</div>
        </div>
        <div>
            <div className="text-xs text-slate-500">Market Cap</div>
            <div className="text-lg font-mono text-white">${(token.marketCap / 1000000).toFixed(2)}M</div>
        </div>
      </div>

      {/* Volume Chart */}
      <div className="p-6 h-48">
        <div className="text-xs text-slate-500 mb-2">Volume Trend (4h)</div>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <Tooltip 
                cursor={{fill: '#334155'}}
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#fff' }}
            />
            <Bar dataKey="vol" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 4 ? '#06b6d4' : '#475569'} />
                ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Deterministic Explainability Section */}
      <div className="p-6 border-t border-slate-700 bg-slate-900/30">
        <h3 className="font-bold text-white flex items-center gap-2 mb-4">
             <BrainCircuit size={18} className="text-purple-400" />
             System Logic
        </h3>
        
        {token.explanation && (
            <div className="space-y-4">
                <div className="bg-slate-800 p-3 rounded border border-slate-700 text-sm text-slate-300">
                    {token.explanation.summary}
                </div>

                <div className="grid grid-cols-1 gap-2">
                    {token.explanation.supportingSignals.map((sig, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-green-200 bg-green-900/10 p-2 rounded">
                            <Check size={12} className="mt-0.5 shrink-0" />
                            {sig}
                        </div>
                    ))}
                     {token.explanation.riskFactors.map((risk, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-red-200 bg-red-900/10 p-2 rounded">
                            <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                            {risk}
                        </div>
                    ))}
                </div>

                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wide border-t border-slate-800 pt-2">
                    {token.explanation.confidenceRationale}
                </div>
            </div>
        )}
      </div>

      {/* AI Deep Dive Section */}
      <div className="p-6 bg-slate-900/50 flex-grow">
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-white flex items-center gap-2">
                <Bot size={18} className="text-primary" /> 
                Deep Analysis (Gemini)
            </h3>
            {!report && (
                <button 
                    onClick={handleAIAnalysis}
                    disabled={loading}
                    className="px-4 py-2 bg-primary hover:bg-blue-600 text-white text-xs rounded font-medium disabled:opacity-50 flex items-center gap-2"
                >
                    {loading && <Loader2 className="animate-spin" size={14} />}
                    {loading ? 'Processing...' : 'Generate Report'}
                </button>
            )}
        </div>

        {report && (
            <div className="space-y-4 animate-fade-in">
                <div className={`p-3 rounded border flex items-center gap-3 ${
                    report.riskLevel === 'LOW' ? 'bg-emerald-900/20 border-emerald-500/50 text-emerald-400' :
                    report.riskLevel === 'MEDIUM' ? 'bg-yellow-900/20 border-yellow-500/50 text-yellow-400' :
                    'bg-red-900/20 border-red-500/50 text-red-400'
                }`}>
                    {report.riskLevel === 'LOW' ? <ShieldCheck size={20}/> : <AlertOctagon size={20} />}
                    <span className="font-bold">Risk Level: {report.riskLevel}</span>
                </div>

                <div className="text-sm text-slate-300 leading-relaxed bg-slate-800 p-4 rounded border border-slate-700">
                    {report.summary}
                </div>

                <div>
                    <div className="text-xs text-slate-500 mb-2 uppercase tracking-wide">Key Factors</div>
                    <ul className="space-y-2">
                        {report.keyFactors.map((f, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                                <Info size={14} className="mt-0.5 text-primary shrink-0" />
                                {f}
                            </li>
                        ))}
                    </ul>
                </div>
                
                <div className="text-xs text-slate-600 italic mt-4 border-t border-slate-700 pt-2">
                    Note: Analysis generated by AI based on current tick data. Not financial advice.
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default DetailPanel;