const { generateNextRoster } = require('./services/rotationService');

console.log('--- Starting Rotation Logic Test ---');

// Mock Data: 10 Rows (Drivers D1..D10, Conductors C1..C10)
// To test block swap, we need to know how "AM/PM" is split.
// logic says "Divide duties into two halves".
const mockData = Array.from({ length: 14 }, (_, i) => ({
    dutyNo: `${i + 1}`,
    time: `${8 + i}:00`,
    driverNo: `D${i + 1}`,
    conductorNo: `C${i + 1}`,
    driverOff: 'FRI',
    conductorOff: 'FRI'
}));

console.log('Input Drivers:', mockData.map(r => r.driverNo).join(', '));

const result = generateNextRoster(mockData);

console.log('Output Drivers:', result.map(r => r.driverNo).join(', '));
console.log('Output Conductors:', result.map(r => r.conductorNo).join(', '));

// Verification
// 1. Rotation Check
// D1 (index 0) should move to index +7? No, "Shift all Driver codes 7 positions down".
// This usually means D1 is at Index 7 (8th position).
// Let's check where D1 went.
const d1Index = result.findIndex(r => r.driverNo === 'D1');
console.log(`D1 is at index: ${d1Index} (Expected around 7 if simple shift)`);

// 2. Block Swap Check
// Top Block (0-6), Bottom (7-13).
// If swapped, old Bottom (D8..D14) should be at Top?
// + Rotation.
// This interaction is complex.
// If Swap FIRST:
// Drivers: [D8...D14, D1...D7]
// Then Rotate +7:
// Shift down 7.
// [D1...D7, D8...D14] ?? Back to original?
// Or specific order?
// Logic says: "Priority: AM to PM... Swap these blocks... Driver Rotation (+7)"
// Usually Block Swap is the MAJOR change, Rotation is the MINOR change within/global.
// My code does: Rotate First (+7), Then Swap Blocks.
// Let's see the result.
