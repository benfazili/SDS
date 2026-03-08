function getZoneLimit(lat, lng){

  // Example: Kigali simplified coordinates (just for demo)
  
  // School / Hospital zones
  if(lat > -1.95 && lat < -1.94 && lng > 30.05 && lng < 30.06){
    return 40;
  }

  // City roads
  if(lat > -1.96 && lat < -1.94 && lng > 30.04 && lng < 30.07){
    return 60;
  }

  // Highways
  return 80;
}

module.exports = getZoneLimit;