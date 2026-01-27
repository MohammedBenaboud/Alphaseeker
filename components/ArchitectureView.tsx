import React from 'react';
import { Database, Cpu, Network, ShieldAlert, BarChart3, ArrowRight, BrainCircuit, Split, ShieldCheck, PlayCircle, Eye, RefreshCw, Beaker } from 'lucide-react';

const ArchitectureView: React.FC = () => {
  return (
    <div className="p-6 space-y-8 animate-fade-in text-slate-300">
      
      {/* Header */}
      <div className="border-b border-slate-700 pb-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Cpu className="text-accent" /> System Architecture v5.0 (Complete)
        </h2>
        <p className="mt-2 text-slate-400">
          Full pipeline: Ingestion → Classification → Risk → Execution → Observability → <strong>Validation</strong>.
          <br/>Includes a retrospective simulation layer to validate logic before live deployment.
        </p>
      </div>

      {/* Data Flow Diagram Representation */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Full System Pipeline</h3>
        <div className="bg-surface p-6 rounded-lg border border-slate-700 overflow-x-auto">
          <div className="flex flex-col gap-6 min-w-[1200px] text-sm relative">
            
            {/* Main Pipeline Row */}
            <div className="flex items-center gap-4 relative z-10">
                {/* Module 1 */}
                <div className="opacity-50 hover:opacity-100 transition-opacity p-3 rounded border border-slate-700 flex flex-col items-center gap-2 w-32 bg-slate-900">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Module 1</span>
                    <Network className="text-primary" size={20} />
                    <span className="font-bold">Ingestion</span>
                </div>

                <ArrowRight className="text-slate-700" size={16} />

                {/* Module 2 */}
                <div className="opacity-50 hover:opacity-100 transition-opacity p-3 rounded border border-slate-700 flex flex-col items-center gap-2 w-32 bg-slate-900">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Module 2</span>
                    <BrainCircuit className="text-indigo-400" size={20} />
                    <span className="font-bold">Intelligence</span>
                </div>

                <ArrowRight className="text-slate-700" size={16} />

                {/* Module 3 */}
                <div className="opacity-50 hover:opacity-100 transition-opacity p-3 rounded border border-slate-700 flex flex-col items-center gap-2 w-32 bg-slate-900">
                     <span className="text-[10px] uppercase font-bold text-slate-500">Module 3</span>
                     <ShieldCheck className="text-emerald-400" size={20} />
                     <span className="font-bold">Execution</span>
                </div>

                <ArrowRight className="text-slate-700" size={16} />

                {/* Module 5 (Simulation) - Parallel Output */}
                <div className="p-3 rounded border border-pink-500/50 bg-pink-900/10 flex flex-col items-center gap-2 w-40 shadow-[0_0_15px_rgba(236,72,153,0.2)]">
                     <span className="text-[10px] uppercase font-bold text-pink-400">Module 5</span>
                     <Beaker className="text-pink-400" size={20} />
                     <span className="font-bold text-white">Simulation Lab</span>
                     <span className="text-[9px] text-slate-400 text-center">Retrospective Analysis</span>
                </div>
            </div>

            {/* Module 4: The Feedback Loop */}
            <div className="absolute top-24 left-0 w-full flex items-center">
                 {/* Feedback lines */}
                 <div className="h-16 w-8 border-l-2 border-b-2 border-purple-500/50 rounded-bl-xl absolute left-16 -top-2"></div>
                 <div className="h-16 w-8 border-l-2 border-b-2 border-purple-500/50 rounded-bl-xl absolute left-[19rem] -top-2"></div>
                 <div className="h-16 w-8 border-l-2 border-b-2 border-purple-500/50 rounded-bl-xl absolute left-[34rem] -top-2"></div>

                 <div className="p-4 rounded border border-purple-500/30 bg-purple-900/10 flex gap-4 ml-[25rem] mt-8 relative z-10 w-[400px]">
                    <div className="absolute -top-3 left-4 bg-purple-900 px-2 text-xs font-mono text-purple-300">MODULE 4: OBSERVABILITY</div>

                    <div className="flex flex-col items-center gap-2 flex-1">
                        <div className="bg-slate-800 p-3 rounded w-full text-center">
                            <Eye className="w-5 h-5 mx-auto mb-1 text-purple-400" />
                            <span className="font-bold text-xs text-white">System Monitor</span>
                        </div>
                    </div>
                    
                    <ArrowRight className="text-slate-600 mt-4" size={16} />

                    <div className="flex flex-col items-center gap-2 flex-1">
                        <div className="bg-slate-800 p-3 rounded w-full text-center">
                            <RefreshCw className="w-5 h-5 mx-auto mb-1 text-pink-400" />
                            <span className="font-bold text-xs">Auto-Tuner</span>
                        </div>
                    </div>
                 </div>
            </div>

          </div>
        </div>
      </div>

      {/* Logic Specs */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-16">
        <div className="bg-surface p-3 rounded border border-slate-700 opacity-60">
          <h3 className="text-xs font-semibold text-white mb-1">Module 1</h3>
          <p className="text-[10px] text-slate-400">Raw Scoring</p>
        </div>

        <div className="bg-surface p-3 rounded border border-slate-700 opacity-60">
          <h3 className="text-xs font-semibold text-white mb-1">Module 2</h3>
           <p className="text-[10px] text-slate-400">Classification</p>
        </div>

        <div className="bg-surface p-3 rounded border border-slate-700 opacity-60">
          <h3 className="text-xs font-semibold text-white mb-1">Module 3</h3>
           <p className="text-[10px] text-slate-400">Risk & Exec</p>
        </div>
        
        <div className="bg-surface p-3 rounded border border-purple-900/50">
          <h3 className="text-xs font-semibold text-purple-200 mb-1">Module 4</h3>
          <p className="text-[10px] text-slate-400">Self-Optimization</p>
        </div>

        <div className="bg-surface p-3 rounded border border-pink-900/50 shadow-md shadow-pink-900/20">
          <h3 className="text-xs font-semibold text-pink-200 mb-1">Module 5: Validation</h3>
          <ul className="space-y-1 text-[10px] text-slate-400">
            <li>• Backtesting</li>
            <li>• Accuracy Heatmaps</li>
            <li>• Signal Valid.</li>
          </ul>
        </div>
      </div>

    </div>
  );
};

export default ArchitectureView;