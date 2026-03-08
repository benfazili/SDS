const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(cors());
app.use(express.json());

// -------------------- MOCK ZONE DETECTOR --------------------
function getZoneLimit(lat,lng){
    // Simple demo: Kigali zones
    if(lat > -1.95 && lat < -1.94 && lng > 30.05 && lng < 30.06) return 40; // school/hospital
    if(lat > -1.96 && lat < -1.94 && lng > 30.04 && lng < 30.07) return 60; // city
    return 80; // highway
}

// -------------------- DRIVER RISK ENGINE --------------------
function calculateRisk(data){
    let riskScore = 0;
    if(data.speed > data.zone_limit) riskScore += 20;
    if(data.behavior === "dangerous") riskScore += 40;
    if(data.behavior === "fatigue") riskScore += 15;

    let level = "SAFE";
    if(riskScore > 30) level = "RISKY";
    if(riskScore > 70) level = "DANGEROUS";

    return {score: riskScore, level};
}

// -------------------- EVENTS & DRIVERS --------------------
let events = [];
let driverLocations = {};

// -------------------- DRIVING RULES --------------------
function checkRules(data){
    let alerts = [];
    if(data.speed > data.zone_limit) alerts.push("Speed Violation");
    if(data.behavior === "dangerous") alerts.push("Dangerous Driving");
    if(data.behavior === "fatigue") alerts.push("Fatigue Warning");
    return alerts;
}

// -------------------- DRIVER DATA API --------------------
app.post("/driver-data",(req,res)=>{
    const data = req.body;

    // auto zone limit
    const zoneLimit = getZoneLimit(data.lat,data.lng);
    data.zone_limit = zoneLimit;

    // calculate risk
    const risk = calculateRisk(data);
    data.risk_level = risk.level;

    // store latest driver position
    driverLocations[data.vehicle_id] = {
        lat: data.lat,
        lng: data.lng,
        driver: data.driver_name,
        risk_level: data.risk_level,
        speed: data.speed,
        zone_limit: data.zone_limit
    };

    // check rules
    const alerts = checkRules(data);
    data.alerts = alerts;

    events.push(data);

    // emit alerts
    alerts.forEach(alert=>{
        if(alert === "Speed Violation" || alert === "Dangerous Driving"){
            io.emit("policeAlert", data);
        }
    });

    // emit driver positions for live map
    io.emit("driverPositions", driverLocations);

    res.json({status:"ok", alerts, risk: data.risk_level});
});

// -------------------- VIEW EVENTS --------------------
app.get("/events",(req,res)=>{
    res.json(events);
});

// -------------------- DASHBOARD --------------------
app.get("/",(req,res)=>{
    res.send(`
<!DOCTYPE html>
<html>
<head>
<title>Police Dashboard</title>
<link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
<style>
body{font-family:Arial;background:#0f172a;color:white;text-align:center;}
h1{color:#38bdf8;}
#map{height:500px;margin:20px auto;width:90%;}
.alert{background:red;padding:15px;margin:10px;border-radius:10px;}
</style>
</head>
<body>
<h1>🚓 Smart Driver Police Dashboard</h1>
<div id="map"></div>
<div id="alerts"></div>

<script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
<script src="/socket.io/socket.io.js"></script>
<script>
const map = L.map('map').setView([-1.944, 30.061], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

const socket = io();
let driverMarkers = {};

// -------------------- DRIVER POSITIONS --------------------
socket.on('driverPositions', positions=>{
    for(const vehicle in positions){
        const driver = positions[vehicle];
        if(driverMarkers[vehicle]){
            driverMarkers[vehicle].setLatLng([driver.lat, driver.lng]);
            driverMarkers[vehicle].setPopupContent(\`Driver: \${driver.driver}<br>Risk: \${driver.risk_level}<br>Speed: \${driver.speed} km/h<br>Zone Limit: \${driver.zone_limit} km/h\`);
        } else {
            driverMarkers[vehicle] = L.marker([driver.lat, driver.lng])
                .addTo(map)
                .bindPopup(\`Driver: \${driver.driver}<br>Risk: \${driver.risk_level}<br>Speed: \${driver.speed} km/h<br>Zone Limit: \${driver.zone_limit} km/h\`);
        }
    }
});

// -------------------- ALERTS --------------------
socket.on("policeAlert",(data)=>{
    const div = document.createElement("div");
    div.className="alert";
    div.innerHTML=\`
    <h3>⚠ ALERT</h3>
    Driver: \${data.driver}<br>
    Vehicle: \${data.vehicle_id}<br>
    Speed: \${data.speed}<br>
    Location: \${data.lat}, \${data.lng}<br>
    Risk: \${data.risk_level}
    \`;
    document.getElementById("alerts").appendChild(div);
});
</script>
</body>
</html>
    `);
});

// -------------------- SERVER --------------------
server.listen(3000,()=>{
    console.log("Smart Driver System running on port 3000");
});