const xlsx = require('xlsx');
const { allocateStaff } = require('./smartAllocationService');

// Helper to rotate array
const rotateArray = (arr, shift) => {
    if (!arr.length) return arr;
    const len = arr.length;
    const effectiveShift = shift % len;
    return [...arr.slice(len - effectiveShift), ...arr.slice(0, len - effectiveShift)];
};

// Helper to format Excel time (fraction of day) to HH:mm
const formatExcelTime = (value) => {
    if (value == null) return '';
    if (typeof value === 'string' && value.includes(':')) return value;
    if (typeof value === 'number') {
        const totalMinutes = Math.round(value * 24 * 60);
        const h = Math.floor(totalMinutes / 60) % 24;
        const m = totalMinutes % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
    return String(value);
};

// Helper to normalize keys (used for parsing file, also useful for processing existing data)
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

const normalizeRosterData = (rawData) => {
    return rawData.map((row) => {
        const newRow = {};
        Object.keys(row).forEach(key => {
            const lowerKey = key.toLowerCase().trim().replace(/[\s._-]+/g, '');
            const value = row[key];

            if (['dutyno', 'duty', 'dno'].includes(lowerKey)) newRow.dutyNo = value;
            else if (['time', 'reportingtime', 'start'].includes(lowerKey)) newRow.time = formatExcelTime(value);
            else if (['driverno', 'driver', 'dcode', 'drivername'].includes(lowerKey)) newRow.driverNo = value;
            else if (['conductorno', 'conductor', 'ccode', 'cond', 'condno', 'cno', 'conductorname', 'condname'].includes(lowerKey)) newRow.conductorNo = value;
            else if (['driveroff', 'doff', 'driverwo'].includes(lowerKey)) newRow.driverOff = normalizeDay(value);
            else if (['conductoroff', 'coff', 'condoff', 'conductorwo'].includes(lowerKey)) newRow.conductorOff = normalizeDay(value);
            else if (['driverreliever', 'drrel'].includes(lowerKey)) newRow.driverReliever = value;
            else if (['conductorreliever', 'condrel'].includes(lowerKey)) newRow.conductorReliever = value;
            else newRow[key] = value;
        });
        return newRow;
    });
};

const parseRoster = (filePath) => {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const json = xlsx.utils.sheet_to_json(sheet);
    return normalizeRosterData(json);
};

// Helper to parse time string "HH:mm" to minutes for sorting
const timeToMinutes = (t) => {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
};

const generateNextRoster = (currentRosterData, driverShift = 8, conductorShift = 1) => {
    console.log(`generateNextRoster called with DriverShift: ${driverShift}, ConductorShift: ${conductorShift}`);

    // Sort Input by Time to ensure AM is Top and PM is Bottom
    const sortedRoster = [...currentRosterData].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

    // 1. HARVEST ALL VALID STAFF (From Regular AND Reliever columns)
    // We need to capture everyone currently working to rotate them.
    const isValid = (id) => id && id.toString().trim().toUpperCase() !== 'SPARE' && id.toString().trim() !== '0';

    const extractUniqueStaff = (data, type) => {
        const staffSet = new Set();
        data.forEach(row => {
            // Check Regular Column
            const regular = type === 'Driver' ? row.driverNo : row.conductorNo;
            if (isValid(regular)) staffSet.add(regular.toString().trim());

            // Check Reliever Column (Relievers cover multiple rows, but we use Set to avoid duplicates)
            const reliever = type === 'Driver' ? row.driverReliever : row.conductorReliever;
            if (isValid(reliever)) staffSet.add(reliever.toString().trim());
        });
        return Array.from(staffSet);
    };

    const allDrivers = extractUniqueStaff(sortedRoster, 'Driver');
    const allConductors = extractUniqueStaff(sortedRoster, 'Conductor');

    console.log(`[Rotation Re-Auth] Harvested Drivers: ${allDrivers.length}, Conductors: ${allConductors.length}`);

    // 2. ROTATE THE STAFF POOL (The Big Flip + Shift)
    const processPool = (pool, shift) => {
        if (pool.length === 0) return [];

        // A. Split into AM (Top) and PM (Bottom) halves
        // Note: 'pool' order depends on extraction order.
        // Assuming 'currentRosterData' is sorted by Time (AM first), extractUniqueStaff maintains that order
        // because we iterate top-to-bottom and Set.add preserves insertion order.

        const mid = Math.floor(pool.length / 2);
        const amGroup = pool.slice(0, mid);
        const pmGroup = pool.slice(mid);

        // B. Swap Groups (AM -> PM, PM -> AM)
        const swappedPool = [...pmGroup, ...amGroup];

        // C. Rotate within newly swapped blocks
        const newAmGroup = swappedPool.slice(0, mid);
        const newPmGroup = swappedPool.slice(mid);

        const rotatedAm = rotateArray(newAmGroup, shift);
        const rotatedPm = rotateArray(newPmGroup, shift);

        return [...rotatedAm, ...rotatedPm];
    };

    const rotatedDrivers = processPool(allDrivers, driverShift);
    const rotatedConductors = processPool(allConductors, conductorShift);

    // 3. PREPARE DUTIES FOR RE-ALLOCATION
    // We need the route structure (DutyNo, Time, Off Days) but stripped of staff.
    const duties = sortedRoster
        .filter(r => r.dutyNo && r.dutyNo !== 'SPARE') // Filter out old Spare rows
        .map(r => ({
            dutyNo: r.dutyNo,
            time: r.time,
            driverOff: r.driverOff,
            conductorOff: r.conductorOff,
            // Clear staff columns
            driverNo: '',
            driverReliever: '',
            conductorNo: '',
            conductorReliever: ''
        }));

    // 4. RE-ALLOCATE USING SMART ALGORITHM
    // This assigns Regulars first, then Relievers, then Spares from our rotated list.
    const driverResult = allocateStaff(duties, rotatedDrivers, 'Driver');
    const finalResult = allocateStaff(driverResult.routes, rotatedConductors, 'Conductor');

    // 5. FORMAT OUTPUT
    const finalRows = finalResult.routes.map(r => ({
        ...r, // Keep all calculations
    }));

    // 6. ADD SPARE ROWS
    const driverSpares = driverResult.spares || [];
    const conductorSpares = finalResult.spares || [];
    const maxSpares = Math.max(driverSpares.length, conductorSpares.length);

    console.log(`[Rotation Re-Auth] Spares Left: Drivers=${driverSpares.length}, Conductors=${conductorSpares.length}`);

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

    // 7. Calculate Rotation Statistics
    const calculateStats = () => {
        // defined 'allDrivers' and 'allConductors' earlier as the "Source" (sorted by time)
        const totalDrivers = allDrivers.length;
        const totalConductors = allConductors.length;

        const checkRotation = (staffList, finalRows, type) => {
            if (!staffList.length) return 0;
            const mid = Math.floor(staffList.length / 2);
            const oldAm = new Set(staffList.slice(0, mid)); // Old Top Half

            // Find who is in the New Top Half (AM) in the final roster
            const newAmCount = Math.ceil(finalRows.length / 2); // Approximation of AM slots

            let movedCount = 0;
            let totalChecked = 0;

            // Check the first 'mid' people in the NEW roster (The New AM Group)
            // We want to see how many of them came from the OLD PM Group (i.e. are NOT in oldAm)
            let actualNewAmCount = 0;
            for (let i = 0; i < finalRows.length; i++) {
                const r = finalRows[i];
                if (r.dutyNo === 'SPARE') continue; // Stop at spares

                const id = type === 'Driver' ? r.driverNo : r.conductorNo;
                if (!id) continue;

                // We only check the first 50% of the active duties
                if (actualNewAmCount >= mid) break;

                if (id && id.toString().trim().toUpperCase() !== 'SPARE') {
                    totalChecked++;
                    if (!oldAm.has(id.toString().trim())) {
                        movedCount++; // This person was NOT in Old AM, so they must be from Old PM = GOOD ROTATION
                    }
                    actualNewAmCount++;
                }
            }

            return totalChecked === 0 ? 0 : Math.round((movedCount / totalChecked) * 100);
        };

        const driverRotationPct = checkRotation(allDrivers, finalRows, 'Driver');
        const conductorRotationPct = checkRotation(allConductors, finalRows, 'Conductor');

        return {
            driverRotationPct,
            conductorRotationPct,
            totalDrivers,
            totalConductors
        };
    };

    const stats = calculateStats();
    console.log('[Rotation Stats]', stats);

    return { roster: [...finalRows, ...spareRows], stats };
};

module.exports = {
    parseRoster,
    generateNextRoster
};
