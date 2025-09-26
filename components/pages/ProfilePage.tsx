import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { UserProfile, Measurement } from '../../types';

// Sub-component for Accordion sections for better organization
const AccordionSection: React.FC<{
    title: string;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}> = ({ title, isOpen, onToggle, children }) => (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
        <button type="button" onClick={onToggle} className="w-full flex justify-between items-center p-4 text-left">
            <h3 className="text-xl font-bold font-['Space_Grotesk']">{title}</h3>
            <svg className={`w-6 h-6 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
        </button>
        {isOpen && (
            <div className="accordion-content p-4 border-t border-gray-700">
                {children}
            </div>
        )}
    </div>
);

const ProfilePage: React.FC = () => {
    const { userProfile, updateUserProfile, geminiApiKey } = useAppContext();


    // UI State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoadingGemini, setIsLoadingGemini] = useState(false);
    const [geminiPrompt, setGeminiPrompt] = useState('');
    const [geminiStatus, setGeminiStatus] = useState('');
    const [openSections, setOpenSections] = useState({
        mission: true,
        biometrics: false,
        health: false,
        training: false,
        nutrition: false,
    });

    // Form State
    const [primaryGoal, setPrimaryGoal] = useState('');
    const [targetDate, setTargetDate] = useState('');
    const [missionStatement, setMissionStatement] = useState('');
    const [height, setHeight] = useState('');
    const [startingWeight, setStartingWeight] = useState<number | '' > ('');
    const [currentWeight, setCurrentWeight] = useState<number | '' > ('');
    const [measurements, setMeasurements] = useState<Measurement[]>([]);
    const [healthFactors, setHealthFactors] = useState('');
    const [readinessModel, setReadinessModel] = useState('');
    const [trainingSplit, setTrainingSplit] = useState('');
    const [cardioTargets, setCardioTargets] = useState('');
    const [trainingDayTargets, setTrainingDayTargets] = useState({ calories: '', protein: '', fat: '', fiber: '', sodium: '' });
    const [recoveryDayTargets, setRecoveryDayTargets] = useState({ calories: '', protein: '', fat: '', fiber: '', sodium: '' });

    // Effect to populate form from context
    useEffect(() => {
        if (userProfile) {
            setPrimaryGoal(userProfile.primaryGoal || 'Body Recomposition');
            setTargetDate(userProfile.targetDate || '');
            setMissionStatement(userProfile.missionStatement || '');
            setHeight(userProfile.height || '');
            setStartingWeight(userProfile.startingWeight || '');
            setCurrentWeight(userProfile.currentWeight || '');
            const measurements = userProfile.measurements || [];
            if (!measurements.find(m => m.name === 'Weight')) {
                measurements.push({ name: 'Weight', value: userProfile.currentWeight || '', unit: 'lbs' });
            }
            setMeasurements(measurements);
            setHealthFactors(userProfile.healthFactors || '');
            setReadinessModel(userProfile.readinessModel || 'Subjective Priority');
            setTrainingSplit(userProfile.trainingSplit || '');
            setCardioTargets(userProfile.cardioTargets || '');
            setTrainingDayTargets(userProfile.trainingDayTargets || { calories: '', protein: '', fat: '', fiber: '', sodium: '' });
            setRecoveryDayTargets(userProfile.recoveryDayTargets || { calories: '', protein: '', fat: '', fiber: '', sodium: '' });
        }
    }, [userProfile]);

    const handleToggleSection = (section: keyof typeof openSections) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleAddMeasurement = () => {
        setMeasurements([...measurements, { name: '', value: '', unit: 'in' }]);
    };

    const handleRemoveMeasurement = (index: number) => {
        setMeasurements(measurements.filter((_, i) => i !== index));
    };

    const handleMeasurementChange = (index: number, field: keyof Measurement, value: string) => {
        const newMeasurements = [...measurements];
        (newMeasurements[index] as any)[field] = value;
        setMeasurements(newMeasurements);
    };

    const handleSaveProfile = (e: React.FormEvent) => {
        e.preventDefault();
        const profileData: UserProfile = {
            primaryGoal,
            targetDate,
            missionStatement,
            height,
            startingWeight: Number(startingWeight),
            currentWeight: Number(currentWeight),
            measurements,
            healthFactors,
            readinessModel,
            trainingSplit,
            cardioTargets,
            trainingDayTargets: {
                calories: Number(trainingDayTargets.calories),
                protein: Number(trainingDayTargets.protein),
                fat: Number(trainingDayTargets.fat),
                fiber: Number(trainingDayTargets.fiber),
                sodium: Number(trainingDayTargets.sodium),
            },
            recoveryDayTargets: {
                calories: Number(recoveryDayTargets.calories),
                protein: Number(recoveryDayTargets.protein),
                fat: Number(recoveryDayTargets.fat),
                fiber: Number(recoveryDayTargets.fiber),
                sodium: Number(recoveryDayTargets.sodium),
            },
        };
        updateUserProfile(profileData);
        // Add some user feedback, e.g., a toast notification
        alert("Profile Saved!");
    };

    const handleGenerateProfile = async () => {
        if (!geminiPrompt.trim()) {
            setGeminiStatus('Please enter a description of your profile.');
            return;
        }
        setIsLoadingGemini(true);
        setGeminiStatus('Gemini is building your profile...');

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;

        const payload = {
            contents: [{ parts: [{ text: geminiPrompt }] }],
            systemInstruction: {
                parts: [{ text: "You are an expert fitness assistant. Your task is to parse the user's unstructured text and extract structured information to populate a user profile form. Fill in every field of the provided JSON schema based on the user's text. If a piece of information is not provided, use a reasonable default or leave the string empty. Today's date is July 6, 2025." }]
            },
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        primaryGoal: { type: "STRING" },
                        targetDate: { type: "STRING", description: "YYYY-MM-DD format" },
                        missionStatement: { type: "STRING" },
                        height: { type: "STRING" },
                        startingWeight: { type: "NUMBER" },
                        healthFactors: { type: "STRING" },
                        readinessModel: { type: "STRING" },
                        trainingSplit: { type: "STRING" },
                        cardioTargets: { type: "STRING" },
                        trainingDayTargets: {
                            type: "OBJECT",
                            properties: { calories: { type: "NUMBER" }, protein: { type: "NUMBER" }, fat: { type: "NUMBER" }, fiber: { type: "NUMBER" }, sodium: { type: "NUMBER" } }
                        },
                        recoveryDayTargets: {
                            type: "OBJECT",
                            properties: { calories: { type: "NUMBER" }, protein: { type: "NUMBER" }, fat: { type: "NUMBER" }, fiber: { type: "NUMBER" }, sodium: { type: "NUMBER" } }
                        },
                         measurements: {
                            type: "ARRAY",
                            items: {
                                type: "OBJECT",
                                properties: { name: { type: "STRING" }, value: { type: "NUMBER" }, unit: { type: "STRING" } }
                            }
                        }
                    }
                }
            }
        };

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error(`API error: ${response.statusText}`);

            const result = await response.json();
            const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (jsonText) {
                const data = JSON.parse(jsonText);
                // Populate state from Gemini response
                setPrimaryGoal(data.primaryGoal || '');
                setTargetDate(data.targetDate || '');
                setMissionStatement(data.missionStatement || '');
                setHeight(data.height || '');
                setStartingWeight(data.startingWeight || '');
                setMeasurements(data.measurements || []);
                setHealthFactors(data.healthFactors || '');
                setReadinessModel(data.readinessModel || '');
                setTrainingSplit(data.trainingSplit || '');
                setCardioTargets(data.cardioTargets || '');
                setTrainingDayTargets(data.trainingDayTargets ? { ...data.trainingDayTargets, calories: String(data.trainingDayTargets.calories || ''), protein: String(data.trainingDayTargets.protein || ''), fat: String(data.trainingDayTargets.fat || ''), fiber: String(data.trainingDayTargets.fiber || ''), sodium: String(data.trainingDayTargets.sodium || '') } : { calories: '', protein: '', fat: '', fiber: '', sodium: '' });
                setRecoveryDayTargets(data.recoveryDayTargets ? { ...data.recoveryDayTargets, calories: String(data.recoveryDayTargets.calories || ''), protein: String(data.recoveryDayTargets.protein || ''), fat: String(data.recoveryDayTargets.fat || ''), fiber: String(data.recoveryDayTargets.fiber || ''), sodium: String(data.recoveryDayTargets.sodium || '') } : { calories: '', protein: '', fat: '', fiber: '', sodium: '' });

                setGeminiStatus('Profile generated successfully!');
                setTimeout(() => {
                    setIsModalOpen(false);
                    setGeminiStatus('');
                }, 1500);
            } else {
                 throw new Error("No content received from API.");
            }
        } catch (error) {
            console.error("Error calling Gemini API:", error);
            setGeminiStatus('Failed to generate profile. Please try again.');
        } finally {
            setIsLoadingGemini(false);
        }
    };

    return (
        <div className="bg-gray-900 text-white font-['Noto_Sans']">
            <div className="container mx-auto p-4 md:p-8 max-w-4xl">
                <header className="text-center mb-10">
                    <h1 className="text-4xl md:text-5xl font-bold text-blue-500 font-['Space_Grotesk']">GeminiFit Profile</h1>
                    <p className="text-gray-400 mt-2">Your central source of truth for a data-driven fitness journey.</p>
                </header>

                {/* Build with Gemini Section */}
                <div className="bg-gray-800 p-6 rounded-lg mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center space-x-4">
                            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
                            <h2 className="text-2xl font-semibold font-['Space_Grotesk']">Build with Gemini</h2>
                        </div>
                        <button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300">
                            Start Building
                        </button>
                    </div>
                    <p className="text-gray-400 mt-2">Use natural language to fill in your profile. Click "Start Building" and describe your goals, stats, and protocols.</p>
                </div>
                
                {/* Profile Form */}
                <form onSubmit={handleSaveProfile} className="space-y-6">
                    <AccordionSection title="Mission Control" isOpen={openSections.mission} onToggle={() => handleToggleSection('mission')}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="primary-goal" className="block text-sm font-medium text-gray-300 mb-1">Primary Goal</label>
                                <select id="primary-goal" value={primaryGoal} onChange={e => setPrimaryGoal(e.target.value)} className="w-full bg-gray-700 border-none rounded-md p-2 focus:ring-2 focus:ring-blue-500">
                                    <option>Body Recomposition</option>
                                    <option>Fat Loss</option>
                                    <option>Muscle Gain</option>
                                    <option>Performance Improvement</option>
                                    <option>Maintenance</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="target-date" className="block text-sm font-medium text-gray-300 mb-1">Target Date</label>
                                <input type="date" id="target-date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="w-full bg-gray-700 border-none rounded-md p-2 focus:ring-2 focus:ring-blue-500" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <label htmlFor="mission-statement" className="block text-sm font-medium text-gray-300 mb-1">Mission Statement / Mantra</label>
                            <textarea id="mission-statement" value={missionStatement} onChange={e => setMissionStatement(e.target.value)} rows={3} className="w-full bg-gray-700 border-none rounded-md p-2 focus:ring-2 focus:ring-blue-500"></textarea>
                        </div>
                    </AccordionSection>

                    <AccordionSection title="Biometrics & Measurements" isOpen={openSections.biometrics} onToggle={() => handleToggleSection('biometrics')}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label htmlFor="height" className="block text-sm font-medium text-gray-300 mb-1">Height</label>
                                <input type="text" id="height" value={height} onChange={e => setHeight(e.target.value)} className="w-full bg-gray-700 border-none rounded-md p-2 focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label htmlFor="starting-weight" className="block text-sm font-medium text-gray-300 mb-1">Starting Weight (lbs)</label>
                                <input type="number" step="0.1" id="starting-weight" value={startingWeight} onChange={e => setStartingWeight(Number(e.target.value))} className="w-full bg-gray-700 border-none rounded-md p-2 focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label htmlFor="current-weight" className="block text-sm font-medium text-gray-300 mb-1">Current Weight (lbs)</label>
                                <input type="number" step="0.1" id="current-weight" value={currentWeight} onChange={e => setCurrentWeight(Number(e.target.value))} className="w-full bg-gray-700 border-none rounded-md p-2 focus:ring-2 focus:ring-blue-500" />
                            </div>
                        </div>
                        <div className="mt-4 space-y-2">
                            <label className="block text-sm font-medium text-gray-300 mb-1">Body Measurements</label>
                            {measurements.map((m, i) => (
                                <div key={i} className="flex items-center space-x-2 measurement-row">
                                    <input type="text" placeholder="Name (e.g., Waist)" value={m.name} onChange={e => handleMeasurementChange(i, 'name', e.target.value)} className="w-1/3 bg-gray-700 border-none rounded-md p-2 focus:ring-2 focus:ring-blue-500" />
                                    <input type="number" step="0.1" placeholder="Value" value={m.value} onChange={e => handleMeasurementChange(i, 'value', e.target.value)} className="w-1/3 bg-gray-700 border-none rounded-md p-2 focus:ring-2 focus:ring-blue-500" />
                                    <select value={m.unit} onChange={e => handleMeasurementChange(i, 'unit', e.target.value)} className="w-1/4 bg-gray-700 border-none rounded-md p-2 focus:ring-2 focus:ring-blue-500">
                                        <option>in</option>
                                        <option>cm</option>
                                    </select>
                                    <button type="button" onClick={() => handleRemoveMeasurement(i)} className="text-red-500 hover:text-red-400 text-2xl font-bold">&times;</button>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={handleAddMeasurement} className="mt-2 text-blue-500 hover:text-blue-600 text-sm font-medium">+ Add Measurement</button>
                    </AccordionSection>

                    <AccordionSection title="Health & Performance Context" isOpen={openSections.health} onToggle={() => handleToggleSection('health')}>
                        <p className="text-gray-400 mb-4">Note any chronic conditions, injuries, allergies, or other factors that influence your training and nutrition.</p>
                        <div>
                            <label htmlFor="health-factors" className="block text-sm font-medium text-gray-300 mb-1">Key Health Factors</label>
                            <textarea id="health-factors" value={healthFactors} onChange={e => setHealthFactors(e.target.value)} rows={3} className="w-full bg-gray-700 border-none rounded-md p-2 focus:ring-2 focus:ring-blue-500"></textarea>
                        </div>
                    </AccordionSection>

                    <AccordionSection title="Training Protocol" isOpen={openSections.training} onToggle={() => handleToggleSection('training')}>
                        <p className="text-gray-400 mb-4">Define your high-level training plan and readiness assessment model.</p>
                        <div>
                            <label htmlFor="readiness-model" className="block text-sm font-medium text-gray-300 mb-1">Readiness Model</label>
                            <select id="readiness-model" value={readinessModel} onChange={e => setReadinessModel(e.target.value)} className="w-full bg-gray-700 border-none rounded-md p-2 focus:ring-2 focus:ring-blue-500">
                                <option>Objective Priority</option>
                                <option>Subjective Priority</option>
                                <option>Balanced</option>
                            </select>
                        </div>
                        <div className="mt-4">
                            <label htmlFor="training-split" className="block text-sm font-medium text-gray-300 mb-1">Weekly Training Split</label>
                            <textarea id="training-split" value={trainingSplit} onChange={e => setTrainingSplit(e.target.value)} rows={3} className="w-full bg-gray-700 border-none rounded-md p-2 focus:ring-2 focus:ring-blue-500"></textarea>
                        </div>
                        <div className="mt-4">
                            <label htmlFor="cardio-targets" className="block text-sm font-medium text-gray-300 mb-1">Cardio Targets</label>
                            <textarea id="cardio-targets" value={cardioTargets} onChange={e => setCardioTargets(e.target.value)} rows={2} className="w-full bg-gray-700 border-none rounded-md p-2 focus:ring-2 focus:ring-blue-500"></textarea>
                        </div>
                    </AccordionSection>

                    <AccordionSection title="Nutrition Protocol" isOpen={openSections.nutrition} onToggle={() => handleToggleSection('nutrition')}>
                        <p className="text-gray-400 mb-4">Set your daily macronutrient and calorie targets for training and recovery days.</p>
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-semibold text-gray-200 mb-2">Training Day Targets</h4>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <div>
                                        <label htmlFor="training-calories" className="block text-sm font-medium text-gray-400 mb-1">Calories</label>
                                        <input id="training-calories" type="number" placeholder="Calories" value={trainingDayTargets.calories} onChange={e => setTrainingDayTargets({...trainingDayTargets, calories: e.target.value})} className="w-full bg-gray-700 border-none rounded-md p-2 focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label htmlFor="training-protein" className="block text-sm font-medium text-gray-400 mb-1">Protein (g)</label>
                                        <input id="training-protein" type="number" placeholder="Protein (g)" value={trainingDayTargets.protein} onChange={e => setTrainingDayTargets({...trainingDayTargets, protein: e.target.value})} className="w-full bg-gray-700 border-none rounded-md p-2 focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label htmlFor="training-fat" className="block text-sm font-medium text-gray-400 mb-1">Fat (g)</label>
                                        <input id="training-fat" type="number" placeholder="Fat (g)" value={trainingDayTargets.fat} onChange={e => setTrainingDayTargets({...trainingDayTargets, fat: e.target.value})} className="w-full bg-gray-700 border-none rounded-md p-2 focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label htmlFor="training-fiber" className="block text-sm font-medium text-gray-400 mb-1">Fiber (g)</label>
                                        <input id="training-fiber" type="number" placeholder="Fiber (g)" value={trainingDayTargets.fiber} onChange={e => setTrainingDayTargets({...trainingDayTargets, fiber: e.target.value})} className="w-full bg-gray-700 border-none rounded-md p-2 focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label htmlFor="training-sodium" className="block text-sm font-medium text-gray-400 mb-1">Sodium (mg)</label>
                                        <input id="training-sodium" type="number" placeholder="Sodium (mg)" value={trainingDayTargets.sodium} onChange={e => setTrainingDayTargets({...trainingDayTargets, sodium: e.target.value})} className="w-full bg-gray-700 border-none rounded-md p-2 focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-200 mb-2">Recovery Day Targets</h4>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <div>
                                        <label htmlFor="recovery-calories" className="block text-sm font-medium text-gray-400 mb-1">Calories</label>
                                        <input id="recovery-calories" type="number" placeholder="Calories" value={recoveryDayTargets.calories} onChange={e => setRecoveryDayTargets({...recoveryDayTargets, calories: e.target.value})} className="w-full bg-gray-700 border-none rounded-md p-2 focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label htmlFor="recovery-protein" className="block text-sm font-medium text-gray-400 mb-1">Protein (g)</label>
                                        <input id="recovery-protein" type="number" placeholder="Protein (g)" value={recoveryDayTargets.protein} onChange={e => setRecoveryDayTargets({...recoveryDayTargets, protein: e.target.value})} className="w-full bg-gray-700 border-none rounded-md p-2 focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label htmlFor="recovery-fat" className="block text-sm font-medium text-gray-400 mb-1">Fat (g)</label>
                                        <input id="recovery-fat" type="number" placeholder="Fat (g)" value={recoveryDayTargets.fat} onChange={e => setRecoveryDayTargets({...recoveryDayTargets, fat: e.target.value})} className="w-full bg-gray-700 border-none rounded-md p-2 focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label htmlFor="recovery-fiber" className="block text-sm font-medium text-gray-400 mb-1">Fiber (g)</label>
                                        <input id="recovery-fiber" type="number" placeholder="Fiber (g)" value={recoveryDayTargets.fiber} onChange={e => setRecoveryDayTargets({...recoveryDayTargets, fiber: e.target.value})} className="w-full bg-gray-700 border-none rounded-md p-2 focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label htmlFor="recovery-sodium" className="block text-sm font-medium text-gray-400 mb-1">Sodium (mg)</label>
                                        <input id="recovery-sodium" type="number" placeholder="Sodium (mg)" value={recoveryDayTargets.sodium} onChange={e => setRecoveryDayTargets({...recoveryDayTargets, sodium: e.target.value})} className="w-full bg-gray-700 border-none rounded-md p-2 focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </AccordionSection>

                    <div className="flex justify-end pt-4">
                        <button type="submit" className="bg-blue-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors duration-300">
                            Save Profile
                        </button>
                    </div>
                </form>
            </div>

            {/* Gemini Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-blue-500 font-['Space_Grotesk']">Build Your Profile with Gemini</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white text-3xl">&times;</button>
                        </div>
                        <p className="text-gray-400 mb-4">Describe your profile in your own words. Include your goals, stats, health notes, and nutrition/training strategies. Gemini will do the rest.</p>
                        <textarea value={geminiPrompt} onChange={e => setGeminiPrompt(e.target.value)} rows={10} className="w-full bg-gray-700 border-none rounded-md p-3 focus:ring-2 focus:ring-blue-500" placeholder="e.g., 'My goal is fat loss. I'm 6 feet tall and currently 220 lbs. I lift 3 times a week... My training day calories are 2000.'"></textarea>
                        
                        {geminiStatus && (
                            <div className="mt-4 text-center">
                                {isLoadingGemini ? (
                                    <div className="flex justify-center items-center">
                                        <div className="loader border-t-blue-500 border-4 border-gray-700 rounded-full w-10 h-10 animate-spin"></div>
                                        <p className="ml-4 text-blue-500">{geminiStatus}</p>
                                    </div>
                                ) : (
                                    <p className={geminiStatus.includes('Failed') ? 'text-red-400' : 'text-green-400'}>{geminiStatus}</p>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end space-x-4 mt-4">
                            <button onClick={() => setIsModalOpen(false)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition">Cancel</button>
                            <button onClick={handleGenerateProfile} disabled={isLoadingGemini} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 flex items-center disabled:opacity-50">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
                                {isLoadingGemini ? 'Generating...' : 'Generate Profile'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;