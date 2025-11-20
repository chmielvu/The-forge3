import React from 'react';
import { YandereLedger } from '../types';
import { Activity, HeartCrack, ShieldAlert, BrainCircuit, Scale } from 'lucide-react';

interface LedgerProps {
  ledger: YandereLedger;
}

const StatBar: React.FC<{ label: string; value: number; colorClass: string; icon: React.ReactNode }> = ({ label, value, colorClass, icon }) => (
  <div className="mb-4 group">
    <div className="flex justify-between items-center mb-1.5 text-[10px] font-mono tracking-[0.15em] text-zinc-500 group-hover:text-zinc-300 transition-colors">
      <span className="flex items-center gap-2 uppercase">{icon} {label}</span>
      <span className="font-bold">{Math.round(value)}%</span>
    </div>
    <div className="h-1 w-full bg-zinc-800 overflow-hidden">
      <div 
        className={`h-full transition-all duration-1000 ease-out ${colorClass}`} 
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  </div>
);

export const LedgerDisplay: React.FC<LedgerProps> = ({ ledger }) => {
  return (
    <div className="border border-zinc-800 bg-zinc-900/50 p-5">
      <h2 className="text-xs font-mono text-zinc-400 mb-6 uppercase tracking-widest flex items-center gap-2 before:w-2 before:h-2 before:bg-oxblood before:rounded-full">
        Psychometric State
      </h2>
      
      <div className="space-y-1">
        <StatBar 
          label="Integrity" 
          value={ledger.physicalIntegrity} 
          colorClass="bg-red-900"
          icon={<Activity size={12} />}
        />
        <StatBar 
          label="Trauma" 
          value={ledger.traumaLevel} 
          colorClass="bg-purple-900"
          icon={<HeartCrack size={12} />}
        />
        <StatBar 
          label="Shame" 
          value={ledger.shamePainAbyssLevel} 
          colorClass="bg-indigo-900"
          icon={<ShieldAlert size={12} />}
        />
        <StatBar 
          label="Hope" 
          value={ledger.hopeLevel} 
          colorClass="bg-yellow-700"
          icon={<BrainCircuit size={12} />}
        />
        <StatBar 
          label="Compliance" 
          value={ledger.complianceScore} 
          colorClass="bg-emerald-900"
          icon={<Scale size={12} />}
        />
      </div>
    </div>
  );
};