import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { DailyLog } from '../../types';
import MetricCard from './MetricCard';
import AddMeasurementModal from './AddMeasurementModal';

/**
 * Defines the props for the MetricsSection component.
 */
interface MetricsSectionProps {
  /** The daily log data for the day being displayed. */
  log: DailyLog | undefined;
  /** A function to be called when the "Edit" button for Fitbit metrics is clicked. */
  onEditMetrics: () => void;
}

/**
 * A component that displays a user's daily metrics, including Fitbit data and manual measurements.
 * It provides functionality to add new measurements or edit existing ones.
 * @param {MetricsSectionProps} props - The props for the component.
 * @returns {JSX.Element} The rendered metrics section.
 */
const MetricsSection: React.FC<MetricsSectionProps> = ({ log, onEditMetrics }) => {
  const { isFitbitAuthenticated, getLogForDate, appData } = useAppContext();
  const [isAddMeasurementModalOpen, setIsAddMeasurementModalOpen] = useState(false);
  const [editingMeasurement, setEditingMeasurement] = useState<string | null>(null);

  const getPreviousMeasurement = (date: string, measurement: keyof DailyLog) => {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    const prevDate = d.toISOString().split('T')[0];
    const prevLog = getLogForDate(prevDate);
    return prevLog ? prevLog[measurement] : undefined;
  };

  const getMetric = (name: string, unit: string, value: number | null | undefined, prevValue: number | null | undefined) => {
    const change = value && prevValue ? value - prevValue : 0;
    return {
      name,
      unit,
      value: value?.toString() || 'N/A',
      change: change > 0 ? `+${change.toFixed(1)}` : change.toFixed(1),
    };
  };

  const handleOpenAddMeasurementModal = (measurementName: string | null = null) => {
    setEditingMeasurement(measurementName);
    setIsAddMeasurementModalOpen(true);
  };

  const handleCloseAddMeasurementModal = () => {
    setEditingMeasurement(null);
    setIsAddMeasurementModalOpen(false);
  };

  return (
    <section className="space-y-4 rounded-lg bg-gray-900 p-4">
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

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Metrics</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {appData?.userProfile?.measurements?.map(m => {
          if (log?.[m.name.toLowerCase()]) {
            return (
              <div key={m.name} onClick={() => handleOpenAddMeasurementModal(m.name)}>
                <MetricCard metric={getMetric(m.name, m.unit, log?.[m.name.toLowerCase()], getPreviousMeasurement(log?.date || '', m.name.toLowerCase()))} />
              </div>
            )
          }
          return null;
        })}
        <div className="bg-slate-800 rounded-lg border border-dashed border-slate-700 p-4 flex flex-col justify-center items-center">
          <button onClick={() => handleOpenAddMeasurementModal()} className="text-slate-400 hover:text-white">
            <span className="material-symbols-outlined text-4xl">add</span>
            <p className="text-sm">Add New</p>
          </button>
        </div>
      </div>

      <AddMeasurementModal
        isOpen={isAddMeasurementModalOpen}
        onClose={handleCloseAddMeasurementModal}
        date={log?.date || ''}
        measurementName={editingMeasurement}
        userProfile={appData?.userProfile}
      />
    </section>
  );
};

export default MetricsSection;