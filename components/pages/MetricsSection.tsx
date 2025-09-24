import React, { useState, useEffect } from 'react';
import MetricInput from './MetricInput';
import { useAppContext } from '../../context/AppContext';
import { DailyLog } from '../../types';

interface MetricsSectionProps {
  log: DailyLog | undefined;
  onEditMetrics: () => void;
}

const MetricsSection: React.FC<MetricsSectionProps> = ({ log, onEditMetrics }) => {
  const { updateLog, isFitbitAuthenticated } = useAppContext();

  const [energyLevel, setEnergyLevel] = useState(log?.energy || 0);
  const [sleepQuality, setSleepQuality] = useState(log?.sleepQuality || 0);
  const [muscleSoreness, setMuscleSoreness] = useState(log?.soreness || 0);
  const [stressLevel, setStressLevel] = useState(log?.yesterdayStress || 0);

  useEffect(() => {
    setEnergyLevel(log?.energy || 0);
    setSleepQuality(log?.sleepQuality || 0);
    setMuscleSoreness(log?.soreness || 0);
    setStressLevel(log?.yesterdayStress || 0);
  }, [log]);

  const handleSave = () => {
    if (log) {
      updateLog(log.date, {
        energy: energyLevel,
        sleepQuality: sleepQuality,
        soreness: muscleSoreness,
        yesterdayStress: stressLevel,
      });
      alert('Metrics saved!');
    }
  };

  const handleCopy = async () => {
    const metricsText = `
Metrics:
Energy Level: ${energyLevel}/5
Sleep Quality: ${sleepQuality}/5
Muscle Soreness: ${muscleSoreness}/5
Stress Level: ${stressLevel}/5
    `.trim();

    try {
      await navigator.clipboard.writeText(metricsText);
      alert('Metrics copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy metrics: ', err);
      alert('Failed to copy metrics.');
    }
  };

  return (
    <section className="space-y-4 rounded-lg bg-gray-900 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Metrics</h2>
        <button
          className="flex items-center gap-2 rounded-full bg-gray-800 px-3 py-1.5 text-xs font-medium text-white"
          onClick={handleCopy}
        >
          <span className="material-symbols-outlined text-sm">content_copy</span>
          Copy
        </button>
      </div>
      {isFitbitAuthenticated && (
        <div className="space-y-2 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-bold text-white">Fitbit Data</h3>
            <button
              className="flex items-center gap-2 rounded-full bg-gray-800 px-3 py-1.5 text-xs font-medium text-white"
              onClick={onEditMetrics}
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              Edit
            </button>
          </div>
          <div className="flex justify-between text-white">
            <span>Readiness Score:</span>
            <span>{log?.readiness?.toString() || 'N/A'}</span>
          </div>
          <div className="flex justify-between text-white">
            <span>HRV:</span>
            <span>{log?.hrv?.toString() || 'N/A'}</span>
          </div>
          <div className="flex justify-between text-white">
            <span>RHR:</span>
            <span>{log?.rhr?.toString() || 'N/A'}</span>
          </div>
          <div className="flex justify-between text-white">
            <span>Calories Burned:</span>
            <span>{log?.calories?.toString() || 'N/A'}</span>
          </div>
        </div>
      )}
      <div className="space-y-4">
        <MetricInput
          label="Energy Level"
          color="bg-green-500"
          value={energyLevel || 0}
          onChange={setEnergyLevel}
        />
        <MetricInput
          label="Sleep Quality"
          color="bg-green-500"
          value={sleepQuality || 0}
          onChange={setSleepQuality}
        />
        <MetricInput
          label="Muscle Soreness"
          color="bg-yellow-500"
          value={muscleSoreness || 0}
          onChange={setMuscleSoreness}
        />
        <MetricInput
          label="Stress Level"
          color="bg-red-500"
          value={stressLevel || 0}
          onChange={setStressLevel}
        />
      </div>
      <button
        className="mt-4 flex h-12 w-full items-center justify-center rounded-lg bg-blue-600 text-base font-bold text-white"
        onClick={handleSave}
      >
        Save
      </button>
    </section>
  );
};

export default MetricsSection;