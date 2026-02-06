/**
 * Smart Allocation Logic (1:6 Rule with Vertical Relief)
 * 
 * Rules:
 * 1. Takes a list of Routes (Duties).
 * 2. Takes a list of Drivers and Conductors.
 * 3. Assigns 1 Regular Staff per Duty.
 * 4. Every group of 6 duties gets 1 Reliever assigned to all of them.
 * 5. Remaining staff are SPARE.
 */

// Normalize Day String to 3-letter Upper Case (e.g. "Sunday" -> "SUN")
const normalizeDay = (day) => {
    if (!day || typeof day !== 'string') return '';
    const d = day.trim().toUpperCase();
    if (d.startsWith('SUN')) return 'SUN';
    if (d.startsWith('MON')) return 'MON';
    if (d.startsWith('TUE')) return 'TUE';
    if (d.startsWith('WED')) return 'WED';
    if (d.startsWith('THU')) return 'THU';
    if (d.startsWith('FRI')) return 'FRI';
    if (d.startsWith('SAT')) return 'SAT';
    return d.slice(0, 3);
};

const allocateStaff = (routes, staffList, type = 'Driver') => {
    const allocatedRoutes = [...routes];
    const availableStaff = [...staffList];
    let staffIndex = 0;

    // Iterate in BLOCKS of 6
    for (let i = 0; i < allocatedRoutes.length; i += 6) {
        const blockEnd = Math.min(i + 6, allocatedRoutes.length);

        // 1. Assign Regulars for this block
        for (let j = i; j < blockEnd; j++) {
            const staffId = staffIndex < availableStaff.length ? availableStaff[staffIndex++] : 'SPARE';
            if (type === 'Driver') allocatedRoutes[j].driverNo = staffId;
            else allocatedRoutes[j].conductorNo = staffId;
        }

        // 2. Assign Reliever for this block
        const relieverId = staffIndex < availableStaff.length ? availableStaff[staffIndex++] : 'SPARE';

        // 3. Calculate Reliever Off Day (Complementary Day)
        // Find the day that is NOT in the block's off days (the day the Reliever isn't working)
        const daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
        const blockOffDays = [];

        for (let k = i; k < blockEnd; k++) {
            const offDay = type === 'Driver' ? allocatedRoutes[k].driverOff : allocatedRoutes[k].conductorOff;
            if (offDay) blockOffDays.push(offDay);
        }

        let relieverOff = daysOfWeek.find(d => !blockOffDays.includes(d));
        if (!relieverOff) relieverOff = 'SUN'; // Fallback

        // 4. Apply Reliever to rows
        for (let j = i; j < blockEnd; j++) {
            if (type === 'Driver') {
                allocatedRoutes[j].driverReliever = relieverId;
                allocatedRoutes[j].driverRelieverOff = relieverId === 'SPARE' ? '' : relieverOff;
            } else {
                allocatedRoutes[j].conductorReliever = relieverId;
                allocatedRoutes[j].conductorRelieverOff = relieverId === 'SPARE' ? '' : relieverOff;
            }
        }
    }

    const spareList = availableStaff.slice(staffIndex);
    return { routes: allocatedRoutes, spares: spareList };
};

const generateInitialRoster = (routes, drivers, conductors) => {
    // 1. Clean Headers & Normalize Days
    const normalizedRoutes = routes.map(r => {
        const newR = {};
        Object.keys(r).forEach(k => {
            const key = k.toLowerCase().trim().replace(/[\s._-]+/g, '');
            if (key.includes('duty')) newR.dutyNo = r[k];
            else if (key.includes('time')) newR.time = r[k];
            else if (key.includes('driveroff') || key.includes('doff')) newR.driverOff = normalizeDay(r[k]);
            else if (key.includes('conductoroff') || key.includes('coff') || key.includes('condoff')) newR.conductorOff = normalizeDay(r[k]);
        });
        return newR;
    });

    // 1.5 Clean Staff Lists
    const cleanDrivers = drivers.filter(d => d && d.toString().trim().toUpperCase() !== 'SPARE');
    const cleanConductors = conductors.filter(c => c && c.toString().trim().toUpperCase() !== 'SPARE');

    console.log('--- ALLOCATION DEBUG START ---');
    console.log('Clean Drivers Count:', cleanDrivers.length);

    // 2. Allocate Drivers
    const driverResult = allocateStaff(normalizedRoutes, cleanDrivers, 'Driver');

    // 3. Allocate Conductors
    const finalResult = allocateStaff(driverResult.routes, cleanConductors, 'Conductor');

    // 4. Format Output
    const finalRows = finalResult.routes.map(r => ({
        dutyNo: r.dutyNo,
        time: r.time,
        driverNo: r.driverNo,
        driverReliever: r.driverReliever,
        driverRelieverOff: r.driverRelieverOff,
        driverOff: r.driverOff,
        conductorNo: r.conductorNo,
        conductorReliever: r.conductorReliever,
        conductorRelieverOff: r.conductorRelieverOff,
        conductorOff: r.conductorOff
    }));

    // 5. Add Spare Rows
    const driverSpares = driverResult.spares || [];
    const conductorSpares = finalResult.spares || [];
    const maxSpares = Math.max(driverSpares.length, conductorSpares.length);

    const spareRows = [];
    for (let i = 0; i < maxSpares; i++) {
        const weekdays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        const spareOffDay = weekdays[i % weekdays.length];
        spareRows.push({
            dutyNo: 'SPARE',
            time: '',
            driverNo: driverSpares[i] || '',
            driverReliever: '',
            driverRelieverOff: '',
            driverOff: spareOffDay,
            conductorNo: conductorSpares[i] || '',
            conductorReliever: '',
            conductorRelieverOff: '',
            conductorOff: spareOffDay
        });
    }

    return [...finalRows, ...spareRows];
};

module.exports = { generateInitialRoster, allocateStaff };
