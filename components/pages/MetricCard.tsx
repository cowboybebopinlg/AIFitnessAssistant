import React from 'react';

export type Metric = {
  name: string;
  value: string;
  unit: string;
  change: string;
};

const MetricCard: React.FC<{ metric: Metric }> = ({ metric }) => {
  const { name, value, unit, change } = metric;

  const getChangeColor = () => {
    if (name === 'Weight') {
      if (change.startsWith('+')) return 'text-red-400';
      if (change.startsWith('- ')) return 'text-green-400';
    }
    if (change.startsWith('+')) return 'text-green-400';
    if (change.startsWith('-')) return 'text-red-400';
    return 'text-gray-400';
  };

  const getIcon = () => {
    switch (name) {
      case 'Weight':
        return 'monitor_weight';
      default:
        return 'straighten';
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <span className="material-symbols-outlined text-3xl text-slate-400">{getIcon()}</span>
        <p className={`text-lg font-semibold ${getChangeColor()}`}>{change}</p>
      </div>
      <div>
        <p className="text-slate-300 text-sm">{name}</p>
        <p className="text-white text-2xl font-bold font-['Space_Grotesk']">{value} <span className="text-lg text-slate-400">{unit}</span></p>
      </div>
    </div>
  );
};

export default MetricCard;