import React from 'react';
import { PortfolioPosition } from '../types';
import { Wallet, PieChart, AlertCircle } from 'lucide-react';

interface PortfolioStatusProps {
  portfolio: PortfolioPosition[];
}

const PortfolioStatus: React.FC<PortfolioStatusProps> = ({ portfolio }) => {
  const totalExposure = portfolio.reduce((acc, curr) => acc + curr.sizeUsd, 0);
  const totalPnl = portfolio.reduce((acc, curr) => acc + curr.unrealizedPnl, 0);

  return (
    <div className="h-full p-6 space-y-6 overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface p-4 rounded-lg border border-slate-700">
                <div className="flex items-center gap-2 text-slate-400 mb-2">
                    <Wallet size={16} className="text-primary" />
                    <span className="text-xs font-bold uppercase">Exposure</span>
                </div>
                <div className="text-2xl font-mono text-white">${totalExposure.toLocaleString()}</div>
                <div className="text-xs text-slate-500 mt-1">Mock USD Deployed</div>
            </div>
            <div className="bg-surface p-4 rounded-lg border border-slate-700">
                <div className="flex items-center gap-2 text-slate-400 mb-2">
                    <PieChart size={16} className="text-accent" />
                    <span className="text-xs font-bold uppercase">Unrealized PnL</span>
                </div>
                <div className={`text-2xl font-mono ${totalPnl >= 0 ? 'text-green-400' : 'text-danger'}`}>
                    {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)}
                </div>
                <div className="text-xs text-slate-500 mt-1">Simulated Performance</div>
            </div>
        </div>

        <div>
            <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                <AlertCircle size={16} /> Active Positions ({portfolio.length})
            </h3>
            
            <div className="space-y-2">
                {portfolio.length === 0 && (
                    <div className="p-8 border border-dashed border-slate-700 rounded-lg text-center text-slate-500 text-sm">
                        No active positions.
                        <br/>Waiting for Execution Engine.
                    </div>
                )}
                {portfolio.map(pos => (
                    <div key={pos.tokenId} className="bg-slate-900/50 p-3 rounded border border-slate-700 flex justify-between items-center">
                        <div>
                            <div className="font-bold text-white">{pos.symbol}</div>
                            <div className="text-xs text-slate-500">
                                Entry: ${pos.entryPrice.toFixed(6)}
                            </div>
                        </div>
                        <div className="text-right">
                             <div className="text-xs text-slate-400 mb-1">${pos.sizeUsd}</div>
                             <div className={`text-sm font-mono font-bold ${pos.unrealizedPnl >= 0 ? 'text-green-400' : 'text-danger'}`}>
                                {pos.unrealizedPnl >= 0 ? '+' : ''}{pos.unrealizedPnl.toFixed(2)}
                             </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
        
        <div className="p-4 bg-blue-900/20 border border-blue-800/50 rounded text-xs text-blue-200">
            <strong className="block mb-1">Risk Governor Active</strong>
            Max Positions: 3<br/>
            Volatility Scaling: ON<br/>
            Global Stop Loss: Dynamic
        </div>
    </div>
  );
};

export default PortfolioStatus;