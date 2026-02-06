import React, { useState } from 'react';
import { getApiUrl } from '../apiConfig';
import FileUpload from './FileUpload';
import RosterTable from './RosterTable';

const RotationModule = () => {
    const [currentRoster, setCurrentRoster] = useState([]);
    const [nextRoster, setNextRoster] = useState([]);
    const [loading, setLoading] = useState(false);
    const [rotationShift, setRotationShift] = useState(8);
    const [conductorShift, setConductorShift] = useState(1);

    const handleUploadSuccess = (data) => {
        setCurrentRoster(data);
        setNextRoster([]);
    };

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const API_URL = getApiUrl();
            const response = await fetch(`${API_URL}/api/rotation/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ shift: rotationShift, condShift: conductorShift })
            });
            const data = await response.json();
            if (response.ok) {
                // Attach stats to the first row or handle separately. 
                // Since the UI expects an array of rows, let's attach the stats to the first element or store separately.
                // The backend returns { roster: [], stats: {} }
                if (data.data.stats) {
                    const rosterWithStats = data.data.roster.map((r, i) => i === 0 ? { ...r, stats: data.data.stats } : r);
                    setNextRoster(rosterWithStats);
                } else {
                    setNextRoster(data.data);
                }
            } else {
                alert('Generation failed: ' + data.error);
            }
        } catch (error) {
            console.error(error);
            alert('Error connecting to server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">🔄 Monthly Rotation</h2>
                <p className="text-gray-600">Upload an existing roster to rotate duties for the next month.</p>
            </div>

            <FileUpload onUploadSuccess={handleUploadSuccess} />

            {currentRoster.length > 0 && (
                <div className="mt-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800">Controls</h2>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded shadow-sm border border-gray-200">
                                <label className="text-sm font-semibold text-gray-700">Driver Shift:</label>
                                <input
                                    type="number"
                                    value={rotationShift}
                                    onChange={(e) => setRotationShift(parseInt(e.target.value) || 0)}
                                    className="w-16 border rounded px-2 py-1 text-center font-bold text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded shadow-sm border border-gray-200">
                                <label className="text-sm font-semibold text-gray-700">Cond Shift:</label>
                                <input
                                    type="number"
                                    value={conductorShift}
                                    onChange={(e) => setConductorShift(parseInt(e.target.value) || 0)}
                                    className="w-16 border rounded px-2 py-1 text-center font-bold text-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                            <button
                                onClick={handleGenerate}
                                disabled={loading}
                                className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow hover:bg-indigo-700 transition transform hover:scale-105"
                            >
                                {loading ? 'Rotating...' : 'Generate Next Month 🔄'}
                            </button>
                        </div>
                    </div>

                    {/* Rotation Stats Panel */}
                    {nextRoster.length > 0 && nextRoster[0].stats && (
                        <div className="mb-6 bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-xl border border-indigo-100 flex justify-around items-center">
                            <div className="text-center">
                                <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Driver Rotation</p>
                                <p className="text-3xl font-extrabold text-indigo-900">{nextRoster[0].stats.driverRotationPct}%</p>
                                <p className="text-xs text-gray-500">flipped to AM/PM</p>
                            </div>
                            <div className="h-10 w-px bg-indigo-200"></div>
                            <div className="text-center">
                                <p className="text-xs text-green-600 font-bold uppercase tracking-wider">Conductor Rotation</p>
                                <p className="text-3xl font-extrabold text-green-900">{nextRoster[0].stats.conductorRotationPct}%</p>
                                <p className="text-xs text-gray-500">flipped to AM/PM</p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                        <div>
                            <RosterTable rosterData={currentRoster} title="Current Month (Input)" />
                        </div>
                        {nextRoster.length > 0 && (
                            <div>
                                <RosterTable
                                    rosterData={nextRoster}
                                    title="Next Month (Generated)"
                                    enableDownload={true}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RotationModule;
