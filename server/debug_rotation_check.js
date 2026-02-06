const { generateNextRoster } = require('./services/rotationService');
const mock = Array.from({ length: 10 }, (_, i) => ({
    dutyNo: i, driverNo: 'D' + i, conductorNo: 'C' + i, time: '10:00'
}));
console.log('Original Cs:', mock.map(m => m.conductorNo).join(','));

const r1 = generateNextRoster(mock, 8, 1);
console.log('Shift 1 Cs:', r1.map(m => m.conductorNo).join(','));

const r5 = generateNextRoster(mock, 8, 5);
console.log('Shift 5 Cs:', r5.map(m => m.conductorNo).join(','));
