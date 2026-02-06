const http = require('http');

// Simulating data sent from Frontend (which has already been normalized by the Upload API)
const data = JSON.stringify({
    routes: [
        {
            "dutyNo": "1",
            "time": "10:00",
            "driverOff": "SUN",  // Pre-normalized key (camelCase, no space)
            "conductorOff": "MON"
        }
    ],
    drivers: ["D1"],
    conductors: ["C1"]
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
        console.log("Sent 'driverOff' (normalized key)...");

        if (validRows[0] && validRows[0].driverOff === 'SUN') {
            console.log("SUCCESS: Backend accepted normalized key.");
        } else {
            console.log("FAILURE: Backend IGNORED normalized key.");
        }
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
