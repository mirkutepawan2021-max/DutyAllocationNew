import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import FileUpload from './FileUpload';
import RosterTable from './RosterTable';

// Helper Component for Stats
const StatCard = ({ title, icon, routes, staffText }) => {
    // 1. Calculate Requirements
    const totalDuties = routes;
    const requiredRelievers = Math.ceil(totalDuties / 6);
    const totalNeeded = totalDuties + requiredRelievers;

    // 2. Calculate Available
    const validStaff = staffText
        .split(/[\n,\s]+/)
        .map(s => s.trim())
        .filter(Boolean)
        .filter(s => s.toUpperCase() !== 'SPARE');

    const available = validStaff.length;
    const diff = available - totalNeeded;
    const isShort = diff < 0;

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center">
                    <span className="text-2xl mr-2">{icon}</span>
                    <h4 className="font-bold text-gray-700">{title}</h4>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${isShort ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {isShort ? 'SHORTAGE' : 'SUFFICIENT'}
                </div>
            </div>

            <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                    <span>Regular Duties:</span>
                    <span className="font-medium">{totalDuties}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                    <span>Relievers Needed (1:6):</span>
                    <span className="font-medium">{requiredRelievers}</span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="font-bold text-gray-800">Total Required:</span>
                    <span className="font-bold text-gray-800">{totalNeeded}</span>
                </div>
                <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                    <span className="font-bold text-gray-700">Available Input:</span>
                    <span className="font-bold text-lg text-blue-600">{available}</span>
                </div>

                <div className={`text-center font-bold p-2 rounded mt-2 ${isShort ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'}`}>
                    {isShort ? `⚠️ Short by ${Math.abs(diff)}` : `✅ ${diff} Spares Available`}
                </div>
            </div>
        </div>
    );
};

const InitializationModule = () => {
    const [routeData, setRouteData] = useState([]);
    const [staffData, setStaffData] = useState({ drivers: '', conductors: '' });
    const [generatedRoster, setGeneratedRoster] = useState([]);
    const [loading, setLoading] = useState(false);

    // 1. Generate & Download Template
    const handleDownloadTemplate = () => {
        const headers = [
            { "Duty No": "1/1", "Time": "06:00", "Driver Off": "MON", "Conductor Off": "MON" },
            { "Duty No": "1/2", "Time": "07:30", "Driver Off": "TUE", "Conductor Off": "TUE" }
        ];
        const worksheet = XLSX.utils.json_to_sheet(headers);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "RouteMaster");
        XLSX.writeFile(workbook, "RouteMaster_Template.xlsx");
    };

    // 2. Handle Route Upload
    const handleRouteUpload = (data) => {
        setRouteData(data);
    };

    // 3. Handle Generation
    const handleGenerate = async () => {
        setLoading(true);
        try {
            const driversList = staffData.drivers.split(/[\n,\s]+/)
                .map(s => s.trim())
                .filter(Boolean)
                .filter(s => s.toUpperCase() !== 'SPARE'); // Filter out "SPARE" text

            const conductorsList = staffData.conductors.split(/[\n,\s]+/)
                .map(s => s.trim())
                .filter(Boolean)
                .filter(s => s.toUpperCase() !== 'SPARE'); // Filter out "SPARE" text

            const API_URL = import.meta.env.VITE_API_URL || '';
            const response = await fetch(`${API_URL}/api/rotation/init/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    routes: routeData,
                    drivers: driversList,
                    conductors: conductorsList
                })
            });
            const data = await response.json();
            if (response.ok) {
                setGeneratedRoster(data.data);
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

    // 4. Handle Rotation (Next Month: Spare -> AM -> PM -> Spare)
    const handleRotate = () => {
        if (generatedRoster.length === 0) {
            alert("Please generate a roster first to establish the current AM/PM/Spare groups.");
            return;
        }

        const rotateList = (type) => {
            // 1. Extract all VALID Staff IDs in current order
            const currentStaff = [];
            generatedRoster.forEach(r => {
                const id = type === 'Driver' ? r.driverNo : r.conductorNo;
                if (id && id.toString().trim().toUpperCase() !== 'SPARE') {
                    currentStaff.push(id);
                }
            });

            // 2. Remove Duplicates (just in case)
            const uniqueStaff = [...new Set(currentStaff)];

            if (uniqueStaff.length === 0) return "";

            // 3. Simple Rotation: Move bottom 40% to Top
            // This forces:
            // - PM/Spare (Bottom) -> AM (Top)
            // - AM (Top) -> PM (Bottom)
            const splitIndex = Math.floor(uniqueStaff.length * 0.6); // Keep top 60% (AM/PM) and move to bottom
            const firstPart = uniqueStaff.slice(0, splitIndex);
            const secondPart = uniqueStaff.slice(splitIndex);

            return [...secondPart, ...firstPart].join(', ');
        };

        const newDrivers = rotateList('Driver');
        const newConductors = rotateList('Conductor');

        setStaffData({ drivers: newDrivers, conductors: newConductors });
        alert("Staff Rotated! (Shift Method) 🔄\n\nI have moved the PM/Spare staff to the Top (AM).\nAnd moved AM staff to the Bottom.\n\nPlease Generate to see the change.");
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-purple-900 mb-2">✨ New Roster Setup</h2>
                <p className="text-gray-600">Step-by-step wizard to create a master roster from scratch.</p>
            </div>

            <div className="space-y-8">
                {/* Step 1: Template */}
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                    <h3 className="font-bold text-purple-800 mb-2">Step 1: Get the Template</h3>
                    <p className="text-sm text-gray-600 mb-3">Download the excel template and fill in your Duty Numbers, Times, and Weekly Offs.</p>
                    <button
                        onClick={handleDownloadTemplate}
                        className="bg-white text-purple-700 border border-purple-300 px-4 py-2 rounded font-semibold hover:bg-purple-50 transition"
                    >
                        ⬇️ Download Route Tempate
                    </button>
                </div>

                {/* Step 2: Upload Routes */}
                <div>
                    <h3 className="font-bold text-gray-800 mb-2">Step 2: Upload Filled Routes</h3>
                    <FileUpload onUploadSuccess={handleRouteUpload} />
                    {routeData.length > 0 && <p className="text-green-600 text-sm mt-2">✅ Loaded {routeData.length} routes</p>}
                </div>

                {/* Step 3: Staff Input */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="font-bold text-gray-800 mb-2">Step 3: Available Drivers</h3>
                        <p className="text-xs text-gray-500 mb-1">Paste numeric IDs, separated by commas or new lines.</p>
                        <textarea
                            className="w-full h-32 p-3 border rounded focus:ring-2 focus:ring-purple-500"
                            placeholder="1001, 1002, 1003..."
                            value={staffData.drivers}
                            onChange={(e) => setStaffData({ ...staffData, drivers: e.target.value })}
                        />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 mb-2">Step 3: Available Conductors</h3>
                        <p className="text-xs text-gray-500 mb-1">Paste numeric IDs, separated by commas or new lines.</p>
                        <textarea
                            className="w-full h-32 p-3 border rounded focus:ring-2 focus:ring-purple-500"
                            placeholder="2001, 2002, 2003..."
                            value={staffData.conductors}
                            onChange={(e) => setStaffData({ ...staffData, conductors: e.target.value })}
                        />
                    </div>
                </div>

            </div>

            {/* Validation Dashboard */}
            {routeData.length > 0 && (
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                        📊 Staff Requirement Check
                        <span className="ml-2 text-xs font-normal text-gray-500 bg-gray-200 px-2 py-1 rounded-full">Real-time</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Driver Stats */}
                        <StatCard
                            title="Drivers"
                            icon="🚌"
                            routes={routeData.length}
                            staffText={staffData.drivers}
                        />

                        {/* Conductor Stats */}
                        <StatCard
                            title="Conductors"
                            icon="🎫"
                            routes={routeData.length}
                            staffText={staffData.conductors}
                        />
                    </div>
                </div>
            )}

            {/* Step 4: Action */}
            <div className="text-center pt-4">
                <button
                    onClick={handleGenerate}
                    disabled={loading || routeData.length === 0}
                    className={`px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition transform hover:scale-105 ${loading || routeData.length === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-xl'
                        }`}
                >
                    {loading ? 'Generating...' : '🚀 Generate Initial Roster'}
                </button>

                {generatedRoster.length > 0 && (
                    <button
                        onClick={handleRotate}
                        className="ml-4 px-6 py-4 rounded-xl font-bold text-lg border-2 border-purple-600 text-purple-700 hover:bg-purple-50 transition transform hover:scale-105"
                    >
                        🔄 Rotate for Next Month
                    </button>
                )}
            </div>

            {generatedRoster.length > 0 && (
                <div className="mt-8">
                    {/* Stats Summary */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
                        <h3 className="font-bold text-blue-900 mb-2">📊 Allocation Summary</h3>
                        <div className="grid grid-cols-2 gap-8 text-sm">
                            <div>
                                <h4 className="font-semibold text-blue-800 border-b border-blue-200 pb-1 mb-2">Drivers</h4>
                                <ul className="space-y-1 text-gray-700">
                                    <li className="flex justify-between"><span>Regular Duties:</span> <span className="font-bold">{generatedRoster.filter(r => r.dutyNo !== 'SPARE').length}</span></li>
                                    <li className="flex justify-between"><span>Relievers Assigned:</span> <span className="font-bold text-purple-700">{new Set(generatedRoster.filter(r => r.dutyNo !== 'SPARE').map(r => r.driverReliever).filter(x => x && x !== 'SPARE')).size}</span></li>
                                    <li className="flex justify-between"><span>Spares (Remaining):</span> <span className="font-bold text-blue-600">{generatedRoster.filter(r => r.dutyNo === 'SPARE' && r.driverNo).length}</span></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold text-green-800 border-b border-green-200 pb-1 mb-2">Conductors</h4>
                                <ul className="space-y-1 text-gray-700">
                                    <li className="flex justify-between"><span>Regular Duties:</span> <span className="font-bold">{generatedRoster.filter(r => r.dutyNo !== 'SPARE').length}</span></li>
                                    <li className="flex justify-between"><span>Relievers Assigned:</span> <span className="font-bold text-purple-700">{new Set(generatedRoster.filter(r => r.dutyNo !== 'SPARE').map(r => r.conductorReliever).filter(x => x && x !== 'SPARE')).size}</span></li>
                                    <li className="flex justify-between"><span>Spares (Remaining):</span> <span className="font-bold text-blue-600">{generatedRoster.filter(r => r.dutyNo === 'SPARE' && r.conductorNo).length}</span></li>
                                </ul>
                            </div>
                        </div>
                        <p className="text-xs text-center text-gray-500 mt-3 italic">
                            * Note: "Relievers" cover weekly offs (1 reliever per 6 duties). "Spares" are any staff left over after that.
                        </p>
                    </div>

                    <RosterTable
                        rosterData={generatedRoster}
                        title="Generated Master Roster"
                        enableDownload={true}
                    />
                </div>
            )}
        </div>
    );
};

export default InitializationModule;
