import React from 'react';
import * as XLSX from 'xlsx';

const RosterTable = ({ rosterData, title, enableDownload }) => {
    if (!rosterData || rosterData.length === 0) return null;

    const handleDownload = () => {
        const worksheet = XLSX.utils.json_to_sheet(rosterData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Roster");
        XLSX.writeFile(workbook, "Generated_Roster.xlsx");
    };

    return (
        <div className="mt-8 overflow-x-auto bg-white rounded-lg shadow-md">
            <div className="flex justify-between items-center p-4 border-b">
                <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                {enableDownload && (
                    <button
                        onClick={handleDownload}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm font-semibold flex items-center gap-2"
                    >
                        <span>📥</span> Download Excel
                    </button>
                )}
            </div>
            <table className="min-w-full text-sm text-left text-gray-800">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        <th className="px-4 py-3">Duty No</th>
                        <th className="px-4 py-3">Time</th>
                        <th className="px-4 py-3">Driver No</th>
                        <th className="border p-2 bg-blue-100 text-blue-900">Dr. Reliever</th>
                        <th className="border p-2 bg-blue-50 text-blue-800 text-xs">Dr. Rel Off</th>
                        <th className="border p-2 bg-gray-100">Driver Off</th>
                        <th className="border p-2 bg-green-100 text-green-900">Cond. No</th>
                        <th className="border p-2 bg-green-100 text-green-900">Cond. Reliever</th>
                        <th className="border p-2 bg-green-50 text-green-800 text-xs">Co. Rel Off</th>
                        <th className="border p-2 bg-gray-100">Cond. Off</th>
                    </tr>
                </thead>
                <tbody>
                    {rosterData.map((row, index) => (
                        <tr key={index} className={`border-b hover:bg-gray-50 ${row.dutyNo === 'SPARE' ? 'bg-yellow-50 font-medium' : ''}`}>
                            <td className="border p-2 text-center">{row.dutyNo || row.DutyNo}</td>
                            <td className="border p-2 text-center">{row.time || row.Time}</td>
                            <td className="border p-2 text-center">{row.driverNo || row.DriverNo || '-'}</td>
                            <td className="border p-2 text-center font-bold text-blue-700">{row.driverReliever || '-'}</td>
                            <td className="border p-2 text-center text-xs text-gray-500">{row.driverRelieverOff || '-'}</td>
                            <td className="border p-2 text-center text-red-600 font-medium">{row.driverOff || row.DriverOff || '-'}</td>
                            <td className="border p-2 text-center">{row.conductorNo || row.ConductorNo || '-'}</td>
                            <td className="border p-2 text-center font-bold text-green-700">{row.conductorReliever || '-'}</td>
                            <td className="border p-2 text-center text-xs text-gray-500">{row.conductorRelieverOff || '-'}</td>
                            <td className="border p-2 text-center text-red-600 font-medium">{row.conductorOff || row.ConductorOff || '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default RosterTable;
