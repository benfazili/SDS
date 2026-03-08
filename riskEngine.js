function calculateRisk(data){

let riskScore = 0;

if(data.speed > data.zone_limit){
riskScore += 20;
}

if(data.behavior === "dangerous"){
riskScore += 40;
}

if(data.behavior === "fatigue"){
riskScore += 15;
}

let level = "SAFE";

if(riskScore > 30){
level = "RISKY";
}

if(riskScore > 70){
level = "DANGEROUS";
}

return {
score: riskScore,
level: level
};

}

module.exports = calculateRisk;