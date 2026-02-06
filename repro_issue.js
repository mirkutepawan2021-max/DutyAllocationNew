const { allocateStaff } = require('./server/services/smartAllocationService');

console.log("Running Reproduction Test for Off Day Conflict...");

// Scenario: Regular has "Sunday" (full word), System tries to avoid "Sunday" but might assign "SUN" (abbr) because it thinks they are different.
const badRoutes = [
    { dutyNo: '1', time: '10:00', driverOff: 'Sunday', conductorOff: 'Sunday' },
    { dutyNo: '2', time: '11:00', driverOff: 'MON', conductorOff: 'MON' },
    { dutyNo: '3', time: '12:00', driverOff: 'TUE', conductorOff: 'TUE' },
    { dutyNo: '4', time: '13:00', driverOff: 'WED', conductorOff: 'WED' },
    { dutyNo: '5', time: '14:00', driverOff: 'THU', conductorOff: 'THU' },
    { dutyNo: '6', time: '15:00', driverOff: 'FRI', conductorOff: 'FRI' }
];

const staff = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'Reliever1'];

const result = allocateStaff(badRoutes, staff, 'Driver');

// Check the first row (where driver has 'Sunday')
const firstRow = result.routes[0];
console.log("Row 1 Driver Off:", firstRow.driverOff);
console.log("Row 1 Reliever Off:", firstRow.driverRelieverOff);

if (firstRow.driverOff.toUpperCase() !== firstRow.driverRelieverOff && 
    (firstRow.driverOff === 'Sunday' && firstRow.driverRelieverOff === 'SUN')) {
    console.log("!!! BUG REPRODUCED !!!");
    console.log("System assigned 'SUN' to Reliever because it didn't recognize 'Sunday' as the same day.");
} else if (firstRow.driverOff.toUpperCase() === firstRow.driverRelieverOff) {
     console.log("!!! CONFLICT DETECTED DIRECTLY (Strings match) !!!");
} else {
    console.log("Logic seems fine here? Off days are different:", firstRow.driverOff, "vs", firstRow.driverRelieverOff);
}
