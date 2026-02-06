const { allocateStaff } = require('./server/services/smartAllocationService');

// Mock Data: 6 Duties with Offs on Mon-Sat (Reliever should match SUN)
const routes1 = [
    { dutyNo: '1', driverOff: 'MON' },
    { dutyNo: '2', driverOff: 'TUE' },
    { dutyNo: '3', driverOff: 'WED' },
    { dutyNo: '4', driverOff: 'THU' },
    { dutyNo: '5', driverOff: 'FRI' },
    { dutyNo: '6', driverOff: 'SAT' }
];

// Mock Data: 6 Duties with Offs on Sun-Fri (Reliever should match SAT)
const routes2 = [
    { dutyNo: '1', driverOff: 'SUN' },
    { dutyNo: '2', driverOff: 'MON' },
    { dutyNo: '3', driverOff: 'TUE' },
    { dutyNo: '4', driverOff: 'WED' },
    { dutyNo: '5', driverOff: 'THU' },
    { dutyNo: '6', driverOff: 'FRI' }
];

const staff = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'RELIEVER_1', 'RELIEVER_2'];

console.log('--- TEST 1: Mon-Sat Offs ---');
const res1 = allocateStaff(routes1, staff, 'Driver');
console.log('Regulars:', res1.routes.map(r => r.driverOff).join(', '));
console.log('Reliever Off:', res1.routes[0].driverRelieverOff);

console.log('\n--- TEST 2: Sun-Fri Offs ---');
const res2 = allocateStaff(routes2, staff, 'Driver');
console.log('Regulars:', res2.routes.map(r => r.driverOff).join(', '));
console.log('Reliever Off:', res2.routes[0].driverRelieverOff);
