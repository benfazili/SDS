function checkCountry(lat, lng){
    // Rwanda approximate coordinates
    const minLat = -2.8;
    const maxLat = -1.0;
    const minLng = 28.8;
    const maxLng = 30.9;

    if(lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng){
        return true; // inside Rwanda
    } else {
        return false; // outside Rwanda
    }
}

module.exports = checkCountry;