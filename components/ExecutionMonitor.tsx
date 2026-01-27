import React, { useRef, useEffect } from 'react';
import { ExecutionLog, ExecutionType } from '../types';
import { Terminal, Shield, CheckCircle, XCircle, ArrowRight } from 'lucide-react';

interface ExecutionMonitorProps {
  logs: ExecutionLog[];
}

const ExecutionMonitor: React.FC<ExecutionMonitorProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <div className="h-full flex flex-col bg-slate-950 font-mono text-sm border-l border-slate-700">
      <div className="p-4 border-b border-slate-800 flex items-center gap-2 bg-slate-900/50">
        <Terminal size={18} className="text-emerald-500" />
        <span className="font-bold text-slate-200">Execution Engine Log</span>
        <span className="text-xs text-slate-500 ml-auto">Live Stream</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {logs.length === 0 && (
            <div className="text-slate-600 italic text-center mt-10">
                Waiting for high-confidence signals...
            </div>
        )}
        
        {logs.map((log) => (
          <div 
            key={log.id} 
            className={`p-3 rounded border relative overflow-hidden animate-fade-in ${
              log.type === ExecutionType.ENTRY ? 'bg-emerald-950/30 border-emerald-800' :
              log.type === ExecutionType.EXIT ? 'bg-blue-950/30 border-blue-800' :
              'bg-slate-900 border-slate-700 opacity-60'
            }`}
          >
            <div className="flex justify-between items-start mb-1">
              <div className="flex items-center gap-2">
                {log.type === ExecutionType.ENTRY && <CheckCircle size={14} className="text-emerald-500" />}
                {log.type === ExecutionType.EXIT && <ArrowRight size={14} className="text-blue-500" />}
                {log.type === ExecutionType.REJECTED && <Shield size={14} className="text-slate-500" />}
                
                <span className={`font-bold ${
                    log.type === ExecutionType.ENTRY ? 'text-emerald-400' :
                    log.type === ExecutionType.EXIT ? 'text-blue-400' :
                    'text-slate-400'
                }`}>
                    {log.type}
                </span>
                <span className="text-slate-300 font-bold">{log.symbol}</span>
              </div>
              <span className="text-slate-500 text-xs">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-4">
                <div>
                    <div className="text-xs text-slate-400 mb-1">Signal: <span className="text-slate-300">{log.reason}</span></div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        <Shield size={10} />
                        {log.riskCheck}
                    </div>
                </div>
                {log.sizeUsd > 0 && (
                    <div className="text-right">
                        <div className="text-xs text-slate-500">Size</div>
                        <div className="font-bold text-slate-200">${log.sizeUsd}</div>
                    </div>
                )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default ExecutionMonitor;