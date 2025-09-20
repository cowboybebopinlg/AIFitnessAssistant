import React, { useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import MetricsSection from './MetricsSection';
import FoodEntriesSection from './FoodEntriesSection';
import WorkoutsSection from './WorkoutsSection';
import { useAppContext } from '../../context/AppContext';

const DailyLog: React.FC = () => {
  const { appData, exportData, importData, getLogForDate } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());

  const dateString = useMemo(() => {
    return currentDate.toISOString().split('T')[0];
  }, [currentDate]);

  const dailyLog = useMemo(() => {
    return getLogForDate(dateString);
  }, [getLogForDate, dateString]);

  const handlePrevDay = () => {
    setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 1)));
  };

  const handleNextDay = () => {
    setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 1)));
  };

  const handleExport = async () => {
    const message = await exportData();
    alert(message);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const jsonString = e.target?.result as string;
          await importData(jsonString);
          alert('Data imported successfully!');
        } catch (error: any) {
          alert(error.message);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-[#121212] dark justify-between group/design-root overflow-x-hidden" style={{ fontFamily: '"Space Grotesk", "Noto Sans", sans-serif' }}>
      <div className="flex-grow">
        <header className="sticky top-0 z-10 bg-[#121212]/80 backdrop-blur-sm">
          <div className="flex items-center justify-between p-4">
            <button className="text-white" onClick={() => navigate('/dashboard')}>
              <span className="material-symbols-outlined">arrow_back_ios_new</span>
            </button>
            <div className="flex items-center gap-2">
              <button className="text-white" onClick={handlePrevDay}>
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <h1 className="text-center text-xl font-bold text-white">{currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</h1>
              <button className="text-white" onClick={handleNextDay}>
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
            <button className="text-white">
              <span className="material-symbols-outlined">calendar_today</span>
            </button>
          </div>
        </header>
        <main className="p-4">
          <div className="flex justify-end mb-4 gap-2">
            <button className="flex items-center gap-2 rounded-full bg-gray-800 px-3 py-1.5 text-xs font-medium text-white">
              <span className="material-symbols-outlined text-sm">content_copy</span>
              Copy All Entries
            </button>
            <button
              className="flex items-center gap-2 rounded-full bg-gray-800 px-3 py-1.5 text-xs font-medium text-white"
              onClick={handleExport}
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Export Data
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              style={{ display: 'none' }}
            />
            <button
              className="flex items-center gap-2 rounded-full bg-gray-800 px-3 py-1.5 text-xs font-medium text-white"
              onClick={handleImportClick}
            >
              <span className="material-symbols-outlined text-sm">upload</span>
              Import Data
            </button>
          </div>
          <MetricsSection log={dailyLog} />
          <FoodEntriesSection log={dailyLog} onAddFoodClick={() => navigate(`/log/add-food?date=${dateString}`)} />
          <WorkoutsSection log={dailyLog} onAddWorkoutClick={() => navigate(`/log/add-workout?date=${dateString}`)} />
        </main>
      </div>
    </div>
  );
};

export default DailyLog;
