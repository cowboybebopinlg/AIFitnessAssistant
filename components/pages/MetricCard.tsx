import React from 'react';

/**
 * Defines the structure for a metric object used in the MetricCard component.
 */
export type Metric = {
  /** The name of the metric (e.g., "Weight", "Body Fat"). */
  name: string;
  /** The current value of the metric. */
  value: string;
  /** The unit for the metric's value (e.g., "lbs", "%"). */
  unit: string;
  /** A string representing the change from the previous measurement (e.g., "+1.2", "-0.5"). */
  change: string;
};

/**
 * A card component for displaying a single user metric, such as weight or body fat percentage.
 * It shows the metric's name, current value, unit, and the change from the last measurement.
 * The color of the change indicator is determined by the metric type and whether the change is positive or negative.
 * @param {object} props - The component props.
 * @param {Metric} props.metric - The metric data to display.
 * @returns {JSX.Element} The rendered metric card component.
 */
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