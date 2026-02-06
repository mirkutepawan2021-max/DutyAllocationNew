const mongoose = require('mongoose');

const RosterSchema = new mongoose.Schema({
    month: { type: String, required: true }, // e.g., "February 2026"
    year: { type: Number, required: true },
    type: { type: String, enum: ['Current', 'Next'], default: 'Current' },
    data: [
        {
            dutyNo: String,
            time: String,
            driverNo: String,
            conductorNo: String,
            driverOff: String,
            conductorOff: String,
            isRegular: { type: Boolean, default: true },
            block: { type: String, enum: ['AM', 'PM', 'Reliever', 'Spare'], default: 'AM' }
        }
    ],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Roster', RosterSchema);
