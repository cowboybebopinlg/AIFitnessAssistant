import React from 'react';
import { AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Area } from 'recharts';



import React from 'react';
import { AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Area } from 'recharts';
import { useAppContext } from '../../context/AppContext';

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-lg p-2">
        <p className="text-white">{`${new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}</p>
        <p className="text-white">{`${payload[0].value.toFixed(1)} ${unit || ''}`}</p>
      </div>
    );
  }
  return null;
};

const TrendChart = ({ data, title, strokeColor, fillColor, unit }) => {
  const yAxisDomain = () => {
    if (!data || data.length === 0) return [0, 100];
    const values = data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.1;
    return [Math.floor(min - padding), Math.ceil(max + padding)];
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
      <h3 className="text-white text-lg font-bold font-['Space_Grotesk'] mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`color${title}`} x1="0" y1="0" y2="1">
              <stop offset="5%" stopColor={fillColor} stopOpacity={0.4}/>
              <stop offset="95%" stopColor={fillColor} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(unixTime) => new Date(unixTime).toLocaleDateString('en-US', { month: 'short' })}
            stroke="#64748b"
            fontSize={12}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={yAxisDomain()}
            stroke="#64748b"
            fontSize={12}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip unit={unit} />} />
          <Area type="monotone" dataKey="value" stroke={strokeColor} strokeWidth={2} fill={`url(#color${title})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const Trends: React.FC = () => {
  const { appData } = useAppContext();

  const logs = appData ? Object.values(appData.logs) : [];

  const weightData = logs
    .filter(log => log.weight)
    .map(log => ({ date: new Date(log.date).getTime(), value: log.weight }));

  const calorieData = logs
    .map(log => ({
      date: new Date(log.date).getTime(),
      value: log.meals.reduce((acc, meal) => acc + meal.calories, 0),
    }))
    .filter(d => d.value > 0);

  const rhrData = logs
    .filter(log => log.rhr)
    .map(log => ({ date: new Date(log.date).getTime(), value: log.rhr }));

  const hrvData = logs
    .filter(log => log.hrv)
    .map(log => ({ date: new Date(log.date).getTime(), value: log.hrv }));

  return (
    <div className="bg-gray-900 text-white min-h-screen font-['Space_Grotesk']">
      <div className="container mx-auto p-4 md:p-8">
        <header className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-blue-500">Trends</h1>
          <p className="text-gray-400 mt-2">Last 90 Days</p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TrendChart data={weightData} title="Weight" strokeColor="#3b82f6" fillColor="#3b82f6" unit="lbs" />
          <TrendChart data={calorieData} title="Avg. Daily Calories" strokeColor="#10b981" fillColor="#10b981" unit="kcal" />
          <TrendChart data={rhrData} title="Resting Heart Rate" strokeColor="#ef4444" fillColor="#ef4444" unit="bpm" />
          <TrendChart data={hrvData} title="Heart Rate Variability" strokeColor="#a855f7" fillColor="#a855f7" unit="ms" />
        </div>
      </div>
    </div>
  );
};

export default Trends;