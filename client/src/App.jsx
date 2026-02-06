import React, { useState } from 'react';
import RotationModule from './components/RotationModule';
import InitializationModule from './components/InitializationModule';

function App() {
  const [activeTab, setActiveTab] = useState('rotation'); // 'rotation' or 'init'

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-blue-900 tracking-tight">🚌 Master Depot Rotation</h1>
        <p className="text-gray-600 mt-2">Automated Duty Allocation System</p>
      </header>

      <main className="max-w-[95vw] mx-auto">
        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 inline-flex">
            <button
              onClick={() => setActiveTab('rotation')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'rotation'
                ? 'bg-blue-100 text-blue-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
            >
              🔄 Monthly Rotation
            </button>
            <button
              onClick={() => setActiveTab('init')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'init'
                ? 'bg-purple-100 text-purple-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
            >
              ✨ New Roster Setup
            </button>
          </div>
        </div>

        {/* Active Module */}
        <div className="transition-all duration-300 ease-in-out">
          {activeTab === 'rotation' && <RotationModule />}
          {activeTab === 'init' && <InitializationModule />}
        </div>

      </main>
    </div>
  );
}

export default App;
