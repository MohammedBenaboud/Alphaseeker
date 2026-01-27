import React from 'react';
import { EnrichedTokenData, MarketState, SignalConfidence } from '../types';
import { Activity, Anchor, Zap, AlertTriangle, Moon, Radio } from 'lucide-react';

interface DecisionBoardProps {
  tokens: EnrichedTokenData[];
}

const StateColumn: React.FC<{ 
  title: string; 
  stateType: MarketState; 
  tokens: EnrichedTokenData[]; 
  icon: React.ReactNode;
  colorClass: string;
}> = ({ title, stateType, tokens, icon, colorClass }) => {
  
  return (
    <div className="flex flex-col h-full min-w-[280px] bg-slate-900/50 rounded-lg border border-slate-700 overflow-hidden">
      <div className={`p-3 border-b border-slate-700 flex items-center justify-between ${colorClass} bg-opacity-10`}>
        <div className="flex items-center gap-2 font-bold text-sm">
          {icon}
          {title}
        </div>
        <span className="text-xs font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-400">
          {tokens.length}
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {tokens.length === 0 && (
          <div className="text-center text-slate-600 text-xs py-10 italic">
            No assets in state
          </div>
        )}
        {tokens.map(token => (
          <div key={token.id} className="bg-surface p-3 rounded border border-slate-700 hover:border-slate-500 transition-colors group">
            <div className="flex justify-between items-start mb-2">
              <span className="font-bold text-white text-sm">{token.symbol}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase border ${
                token.decision.confidence === SignalConfidence.HIGH ? 'border-accent text-accent' :
                token.decision.confidence === SignalConfidence.MEDIUM ? 'border-yellow-500 text-yellow-500' :
                'border-slate-600 text-slate-500'
              }`}>
                {token.decision.confidence} CONF
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 mb-2 font-mono">
              <div>
                <span className="block text-slate-600">Score</span>
                <span className={token.momentumScore > 70 ? 'text-green-400' : 'text-slate-300'}>
                  {token.momentumScore}
                </span>
              </div>
              <div className="text-right">
                <span className="block text-slate-600">Vol Spike</span>
                <span className={token.volumeSpikeFactor > 2 ? 'text-accent' : 'text-slate-300'}>
                  {token.volumeSpikeFactor.toFixed(1)}x
                </span>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-700/50 flex items-center gap-1 truncate">
              <Radio size={10} className="text-primary animate-pulse" />
              {token.decision.triggerEvent}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const DecisionBoard: React.FC<DecisionBoardProps> = ({ tokens }) => {
  // Group tokens by decision state
  const grouped = {
    [MarketState.DORMANT]: tokens.filter(t => t.decision.state === MarketState.DORMANT),
    [MarketState.ACCUMULATION]: tokens.filter(t => t.decision.state === MarketState.ACCUMULATION),
    [MarketState.MOMENTUM]: tokens.filter(t => t.decision.state === MarketState.MOMENTUM),
    [MarketState.OVEREXTENDED]: tokens.filter(t => t.decision.state === MarketState.OVEREXTENDED),
    [MarketState.UNSTABLE]: tokens.filter(t => t.decision.state === MarketState.UNSTABLE),
  };

  return (
    <div className="h-full overflow-x-auto p-6">
      <div className="flex gap-4 h-full min-w-max">
        
        <StateColumn 
          title="Dormant" 
          stateType={MarketState.DORMANT} 
          tokens={grouped[MarketState.DORMANT]} 
          icon={<Moon size={16} />}
          colorClass="text-slate-400 bg-slate-500"
        />

        <StateColumn 
          title="Accumulating" 
          stateType={MarketState.ACCUMULATION} 
          tokens={grouped[MarketState.ACCUMULATION]} 
          icon={<Anchor size={16} />}
          colorClass="text-blue-400 bg-blue-500"
        />

        <StateColumn 
          title="Momentum" 
          stateType={MarketState.MOMENTUM} 
          tokens={grouped[MarketState.MOMENTUM]} 
          icon={<Zap size={16} />}
          colorClass="text-accent bg-accent"
        />

        <StateColumn 
          title="Overextended" 
          stateType={MarketState.OVEREXTENDED} 
          tokens={grouped[MarketState.OVEREXTENDED]} 
          icon={<Activity size={16} />}
          colorClass="text-orange-400 bg-orange-500"
        />

        <StateColumn 
          title="Unstable / Risky" 
          stateType={MarketState.UNSTABLE} 
          tokens={grouped[MarketState.UNSTABLE]} 
          icon={<AlertTriangle size={16} />}
          colorClass="text-red-400 bg-red-500"
        />

      </div>
    </div>
  );
};

export default DecisionBoard;