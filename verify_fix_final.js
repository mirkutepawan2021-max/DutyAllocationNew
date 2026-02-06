const { generateInitialRoster } = require('./server/services/smartAllocationService');

console.log("Running Final Verification...");

// 1. Setup Bad Inputs (Sunday, Tues)
const routes = [
    { dutyNo: '1', time: '10:00', driverOff: 'Sunday', conductorOff: 'Sunday' },
    { dutyNo: '2', time: '11:00', driverOff: 'Tues', conductorOff: 'Tues' },
    { dutyNo: '3', time: '12:00', driverOff: 'Wednesday', conductorOff: 'Wednesday' },
    { dutyNo: '4', time: '13:00', driverOff: 'Thu', conductorOff: 'Thu' },
    { dutyNo: '5', time: '14:00', driverOff: 'Fri', conductorOff: 'Fri' },
    { dutyNo: '6', time: '15:00', driverOff: 'Sat', conductorOff: 'Sat' }
];

const drivers = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'Reliever1'];
const conductors = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'RelieverC'];

// 2. Run Generation (which triggers normalization and allocation)
const roster = generateInitialRoster(routes, drivers, conductors);

// 3. Inspect Results
console.log("\n--- Inspection ---");
roster.slice(0, 6).forEach(r => {
    console.log(`Duty ${r.dutyNo}: DriverOff=${r.driverOff}, RelieverOff=${r.driverRelieverOff}`);

    // Check Normalization
    if (r.driverOff.length > 3) console.error(`ERROR: Normalization failed for ${r.driverOff}`);

    // Check Forced Sunday
    if (r.driverRelieverOff !== 'SUN') console.error(`ERROR: Reliever Off is NOT SUN! (Found: ${r.driverRelieverOff})`);
});

// 4. Verify Sunday Clash Acceptance
const sunRow = roster.find(r => r.driverOff === 'SUN');
if (sunRow && sunRow.driverRelieverOff === 'SUN') {
    console.log("\nConfirmed: Sunday Regular Off + Sunday Reliever Off coexist (Spares will cover).");
}

console.log("\nVerification Complete.");
