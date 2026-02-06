const http = require('http');

const data = JSON.stringify({
    routes: Array.from({ length: 6 }, (_, i) => ({
        "Duty No": `${i + 1}`,
        "Time": "10:00",
        "Driver Off": "SUN",
        "Conductor Off": "MON"
    })),
    drivers: ["D1", "D2", "D3", "D4", "D5", "D6"],
    conductors: ["C1", "C2", "C3", "C4", "C5", "C6"]
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
        const validRows = json.data.filter(r => r.dutyNo !== 'SPARE');
        console.log("Sent 6 items with 'Driver Off': 'SUN'");
        console.log("Received Data Sample (First Row):");
        console.log(validRows[0]);

        if (validRows[0] && validRows[0].driverOff === 'SUN') {
            console.log("SUCCESS: Driver Off data preserved.");
        } else {
            console.log("FAILURE: Driver Off data LOST.");
        }
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
