const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const DATA_FILE = path.join(DATA_DIR, 'rosters.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

// Ensure data file exists
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

const getAllRosters = () => {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading data file', err);
        return [];
    }
};

const saveRoster = (roster) => {
    const rosters = getAllRosters();
    rosters.push(roster);
    fs.writeFileSync(DATA_FILE, JSON.stringify(rosters, null, 2));
    return roster;
};

const getLatestRoster = (type = 'Current') => {
    const rosters = getAllRosters();
    // Filter by type and sort by createdAt descending
    const filtered = rosters.filter(r => r.type === type);
    return filtered.length > 0 ? filtered[filtered.length - 1] : null;
};

module.exports = {
    saveRoster,
    getLatestRoster
};
