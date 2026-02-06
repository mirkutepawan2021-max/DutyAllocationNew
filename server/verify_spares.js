const http = require('http');

const data = JSON.stringify({
    routes: Array.from({ length: 12 }, (_, i) => ({ "Duty No": `${i + 1}`, "Time": "10:00" })),
    drivers: Array.from({ length: 15 }, (_, i) => `D${i + 1}`), // 15 Drivers
    conductors: []
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/rotation/init/generate',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        const json = JSON.parse(body);
        const spares = json.data.filter(r => r.dutyNo === 'SPARE');
        console.log(`Routes: 12`);
        console.log(`Staff: 15`);
        console.log(`Regulars Expected: 12`);
        console.log(`Relievers Expected: 2 (1 per 6)`);
        console.log(`Spares Expected: 1 (15 - 12 - 2)`);
        console.log(`Actual Spares in Response: ${spares.length}`);
        if (spares.length > 0) console.log("Spares Found:", spares);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
