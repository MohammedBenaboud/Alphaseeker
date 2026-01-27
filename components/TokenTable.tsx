import React from 'react';
import { TokenData } from '../types';
import { ArrowUpRight, ArrowDownRight, Activity, TrendingUp, AlertTriangle } from 'lucide-react';

interface TokenTableProps {
  tokens: TokenData[];
  onSelectToken: (token: TokenData) => void;
  selectedTokenId?: string;
}

const TokenTable: React.FC<TokenTableProps> = ({ tokens, onSelectToken, selectedTokenId }) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: val < 0.01 ? 6 : 2,
      maximumFractionDigits: val < 0.01 ? 8 : 2,
    }).format(val);
  };

  const formatCompact = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: 1
    }).format(val);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-slate-400';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-900/50 text-slate-400 uppercase font-mono text-xs">
          <tr>
            <th className="px-4 py-3">Rank</th>
            <th className="px-4 py-3">Asset</th>
            <th className="px-4 py-3 text-right">Price</th>
            <th className="px-4 py-3 text-right">5m %</th>
            <th className="px-4 py-3 text-right">Vol (24h)</th>
            <th className="px-4 py-3 text-right">Liq</th>
            <th className="px-4 py-3 text-center">Score</th>
            <th className="px-4 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/50">
          {tokens.map((token, idx) => {
            const isSelected = selectedTokenId === token.id;
            return (
              <tr 
                key={token.id} 
                className={`
                  hover:bg-slate-800/50 transition-colors cursor-pointer border-l-2
                  ${isSelected ? 'bg-slate-800 border-accent' : 'border-transparent'}
                `}
                onClick={() => onSelectToken(token)}
              >
                <td className="px-4 py-3 font-mono text-slate-500">#{idx + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-white">
                      {token.symbol[0]}
                    </div>
                    <div>
                      <div className="font-bold text-white">{token.symbol}</div>
                      <div className="text-xs text-slate-500 flex gap-1">
                        {token.volumeSpikeFactor > 2 && (
                           <span className="text-accent flex items-center"><Activity size={10} className="mr-0.5" /> Spike</span>
                        )}
                        {token.priceChange.m5 > 5 && (
                           <span className="text-green-400 flex items-center"><TrendingUp size={10} className="mr-0.5" /> Pump</span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-mono text-white">
                  {formatCurrency(token.price)}
                </td>
                <td className={`px-4 py-3 text-right font-mono ${token.priceChange.m5 >= 0 ? 'text-green-400' : 'text-danger'}`}>
                  <div className="flex items-center justify-end gap-1">
                    {token.priceChange.m5 >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {Math.abs(token.priceChange.m5).toFixed(2)}%
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-mono text-slate-300">
                  ${formatCompact(token.volume24h)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-slate-300">
                  ${formatCompact(token.liquidity)}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className={`font-bold font-mono text-lg ${getScoreColor(token.momentumScore)}`}>
                    {token.momentumScore}
                  </div>
                </td>
                 <td className="px-4 py-3 text-right">
                    <button className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-xs text-white rounded transition-colors">
                        Analyze
                    </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TokenTable;