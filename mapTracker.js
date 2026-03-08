// In server.js (or mapTracker.js if separate)
let driverLocations = {}; // store latest position of each driver

// when driver data comes in
app.post("/driver-data", (req, res) => {
    const data = req.body;

    // Automatically detect zone
    const zoneLimit = getZoneLimit(data.lat, data.lng);
    data.zone_limit = zoneLimit;

    // Calculate risk
    const risk = calculateRisk(data);
    data.risk_level = risk.level;

    // Store latest driver position
    driverLocations[data.vehicle_id] = {
        lat: data.lat,
        lng: data.lng,
        driver: data.driver_name,
        risk_level: data.risk_level
    };

    // Check driving rules
    const alerts = checkRules(data);
    data.alerts = alerts;

    // Send alerts to police dashboard
    alerts.forEach(alert => {
        if(alert === "Speed Violation" || alert === "Dangerous Driving"){
            io.emit("policeAlert", data);
        }
    });

    // Send updated map positions
    io.emit("driverPositions", driverLocations);

    res.json({ status: "ok", alerts, risk: data.risk_level });
});