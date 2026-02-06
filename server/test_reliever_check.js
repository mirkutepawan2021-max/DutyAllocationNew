const { generateNextRoster } = require('./services/rotationService');

// Mock Data based on User's Image
// Reliever '15' is AM (10:00)
// Reliever '16' is PM (12:00 for this test case, or just later than 10)
// We need enough data to enforce a split. Let's create 6 duties.
// 3 AM Duties (Drivers 1,2,3 + Reliever 15)
// 3 PM Duties (Drivers 4,5,6 + Reliever 16)

const mockRoster = [
    { dutyNo: '1', time: '06:00', driverNo: 'D1', driverReliever: 'R_AM' }, // 06:00
    { dutyNo: '2', time: '07:00', driverNo: 'D2', driverReliever: 'R_AM' }, // 07:00
    { dutyNo: '3', time: '08:00', driverNo: 'D3', driverReliever: 'R_AM' }, // 08:00
    // -- Midpoint --
    { dutyNo: '4', time: '14:00', driverNo: 'D4', driverReliever: 'R_PM' }, // 14:00
    { dutyNo: '5', time: '15:00', driverNo: 'D5', driverReliever: 'R_PM' }, // 15:00
    { dutyNo: '6', time: '16:00', driverNo: 'D6', driverReliever: 'R_PM' }, // 16:00
];

console.log('--- TEST START ---');
console.log('INPUT:');
console.log('AM Team (Top): D1, D2, D3 + Reliever R_AM');
console.log('PM Team (Btm): D4, D5, D6 + Reliever R_PM');

// Generate Next Month
// Shift = 0 (Just simple AM/PM swap) to verify position change clearly.
const result = generateNextRoster(mockRoster, 0, 0);

console.log('\n--- OUTPUT (Next Month) ---');
// We expect PM Team to be at the TOP now.
// R_PM should be assigned to one of the first duties (AM).
// R_AM should be assigned to the later duties (PM) or Spare.

result.forEach((r, i) => {
    if (r.dutyNo === 'SPARE') return; // Skip spares for clarity
    console.log(`Duty ${r.dutyNo} (${r.time}): Driver=${r.driverNo}, Reliever=${r.driverReliever}`);
});

console.log('\n--- VERIFICATION ---');
const firstDutyDriver = result[0].driverNo;
const firstDutyReliever = result[0].driverReliever;

// The first duty (06:00) should now be filled by someone from the OLD PM TEAM (D4, D5, D6, or R_PM).
const pmTeam = ['D4', 'D5', 'D6', 'R_PM'];
const amTeam = ['D1', 'D2', 'D3', 'R_AM'];

if (pmTeam.includes(firstDutyDriver)) {
    console.log(`✅ SUCCESS: First Duty Driver (${firstDutyDriver}) came from the PM Team.`);
} else {
    console.log(`❌ FAIL: First Duty Driver (${firstDutyDriver}) did NOT come from PM Team.`);
}

// Find where R_AM went (Should be late or spare)
const rAmPos = result.findIndex(r => r.driverNo === 'R_AM' || r.driverReliever === 'R_AM');
const rPmPos = result.findIndex(r => r.driverNo === 'R_PM' || r.driverReliever === 'R_PM');

console.log(`R_AM (Old AM Reliever) is now at index: ${rAmPos} (Should be lower)`);
console.log(`R_PM (Old PM Reliever) is now at index: ${rPmPos} (Should be higher/early)`);

if (rPmPos < rAmPos) {
    console.log('✅ SUCCESS: R_PM rotated to EARLIER slot than R_AM.');
} else {
    console.log('❌ FAIL: Rotation did not swap Relievers correctly.');
}
