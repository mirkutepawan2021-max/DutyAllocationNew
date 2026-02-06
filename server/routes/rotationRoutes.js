const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { parseRoster, generateNextRoster } = require('../services/rotationService');
// const Roster = require('../models/RosterSchema'); // MongoDB Disabled
const { saveRoster, getLatestRoster } = require('../services/fileStore');
const fs = require('fs');

// POST /api/rotation/upload
router.post('/upload', upload.single('rosterFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const filePath = req.file.path;
        let rosterData;
        try {
            rosterData = parseRoster(filePath);
        } catch (e) {
            return res.status(400).json({ error: 'Failed to parse file. Ensure it is a valid Excel/CSV.' });
        }

        // Clean up file
        try { fs.unlinkSync(filePath); } catch (e) { }

        // Save Current Roster to JSON Store
        const newRoster = {
            id: Date.now().toString(),
            month: req.body.month || 'Current',
            year: req.body.year || new Date().getFullYear(),
            type: 'Current',
            data: rosterData,
            createdAt: new Date()
        };

        saveRoster(newRoster);

        res.json({ message: 'Roster uploaded successfully', count: rosterData.length, data: rosterData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to process file: ' + error.message });
    }
});

// POST /api/rotation/generate
router.post('/generate', async (req, res) => {
    try {
        // Fetch latest 'Current' roster from JSON Store
        const currentRoster = getLatestRoster('Current');

        if (!currentRoster) {
            return res.status(404).json({ error: 'No current roster found to rotate. Please upload one first.' });
        }

        const shift = parseInt(req.body.shift) || 8;
        const condShift = parseInt(req.body.condShift) || 1;
        console.log('Generating Rotation. Request Body:', req.body);
        console.log(`Parsed Shifts - Driver: ${shift}, Conductor: ${condShift}`);
        const nextRosterData = generateNextRoster(currentRoster.data, shift, condShift);

        res.json({ message: 'Rotation generated', data: nextRosterData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Rotation failed: ' + error.message });
    }
});

const { generateInitialRoster } = require('../services/smartAllocationService');

// ... existing routes

// Start Generation Route
router.post('/init/generate', async (req, res) => {
    try {
        const { routes, drivers, conductors } = req.body;

        if (!routes || !Array.isArray(routes) || routes.length === 0) {
            return res.status(400).json({ error: 'No routes provided' });
        }

        console.log(`Generating Initial Roster. Routes: ${routes.length}, Drivers: ${drivers.length}, Conds: ${conductors.length}`);

        const generatedData = generateInitialRoster(routes, drivers, conductors);

        res.json({ success: true, data: generatedData });
    } catch (error) {
        console.error('Initialization Error:', error);
        res.status(500).json({ error: 'Failed to generate initial roster' });
    }
});

module.exports = router;
