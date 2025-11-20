import React from 'react';
import { YandereLedger } from '../types';
import { Activity, HeartCrack, ShieldAlert, BrainCircuit, Scale } from 'lucide-react';

interface LedgerProps {
  ledger: YandereLedger;
}

const StatBar: React.FC<{ label: string; value: number; color: string; icon: React.ReactNode }> = ({ label, value, color, icon }) => (
  <div className="mb-3 group relative">
    <div className="flex justify-between items-center mb-1 text-xs font-serif tracking-widest text-textBone opacity-80">
      <span className="flex items-center gap-2">{icon} {label.toUpperCase()}</span>
      <span>{Math.round(value)}%</span>
    </div>
    <div className="h-1.5 w-full bg-concrete border border-opacity-20 border-textBone rounded-full overflow-hidden">
      <div 
        className={`h-full transition-all duration-1000 ease-out ${color}`} 
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  </div>
);

export const LedgerDisplay: React.FC<LedgerProps> = ({ ledger }) => {
  return (
    <div className="p-6 border-2 border-oxblood bg-concrete bg-opacity-90 backdrop-blur-sm shadow-2xl">
      <h2 className="text-xl font-heading text-renaissanceGold mb-4 border-b border-oxblood pb-2 tracking-[0.2em]">
        Yandere Ledger
      </h2>
      
      <div className="space-y-4">
        <StatBar 
          label="Physical Integrity" 
          value={ledger.physicalIntegrity} 
          color="bg-red-700"
          icon={<Activity size={14} />}
        />
        <StatBar 
          label="Trauma Level" 
          value={ledger.traumaLevel} 
          color="bg-purple-600"
          icon={<HeartCrack size={14} />}
        />
        <StatBar 
          label="Shame / Abyss" 
          value={ledger.shamePainAbyssLevel} 
          color="bg-indigo-900"
          icon={<ShieldAlert size={14} />}
        />
        <StatBar 
          label="Hope" 
          value={ledger.hopeLevel} 
          color="bg-candleGlow"
          icon={<BrainCircuit size={14} />}
        />
        <StatBar 
          label="Compliance" 
          value={ledger.complianceScore} 
          color="bg-emerald-800"
          icon={<Scale size={14} />}
        />
      </div>
    </div>
  );
};
