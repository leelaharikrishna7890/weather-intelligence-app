import { WeatherData, LocationResult, AIIntelligence } from "../types";

export function generateLocalIntelligence(weather: WeatherData, city: LocationResult): AIIntelligence {
  const currentTemp = weather.current.temperature_2m;
  const isRainy = weather.current.precipitation > 0 || (weather.daily.precipitation_sum?.[0] || 0) > 2;
  const isWindy = weather.current.wind_speed_10m > 20;
  const isCold = currentTemp < 12;
  const isHot = currentTemp > 28;
  const rainMaxProb = weather.daily.precipitation_probability_max?.[0] || 0;
  const uvMax = weather.daily.uv_index_max?.[0] || 1;

  // Comfort assessments
  let comfortIndex = "Optimal (85/100)";
  if (isHot) comfortIndex = "Hyperthermal Warning (35/100)";
  else if (isCold) comfortIndex = "Hypothermal Chill (50/100)";
  else if (isRainy) comfortIndex = "Damp Weather Index (60/100)";

  // Suitability assessments
  let suitabilityScore = 80;
  let assessment = "Superb day for physical exertion, hiking, and open-sky ventures.";
  let safeActivities = ["Scenic Jogging", "Bento Park Picnic", "Open Air Cycling", "Landscape Photography"];

  if (isRainy) {
    suitabilityScore = 30;
    assessment = "Precipitation risk hampers open-air exercises. Transition to covered environments recommended.";
    safeActivities = ["Indoor Squash", "Museum Excursions", "Fitness Archery", "Yoga Studio Workouts"];
  } else if (isHot) {
    suitabilityScore = 55;
    assessment = "High thermophilic strain. Conduct open-air tasks during morning or sunset windows.";
    safeActivities = ["Early Morning Jog", "Hydroworld Swimming", "Shaded Forest Walkway", "Air-conditioned Indoor Climbing"];
  } else if (isWindy) {
    suitabilityScore = 60;
    assessment = "High convective wind gusts detected. Exercise with windbreakers or try indoor ranges.";
    safeActivities = ["Windward Kite Flying", "Thermal Spa Wellness", "Heated Indoor Track", "Gymnasium Badminton"];
  }

  // UV risk
  let uvRisk = "Low Risk (1-2)";
  if (uvMax > 8) uvRisk = "Extreme Warning (9-11+). Broad-spectrum application mandatory.";
  else if (uvMax > 5) uvRisk = "Moderate-High Risk (6-8). Sunscreens recommended.";

  // Home energy optimizer
  let hvacOptimization = "Ventilation active. Natural cooling via evening airflow windows is optimal.";
  if (isHot) hvacOptimization = "Compressor cooling engaged. Seal all drafts and optimize smart cooling to 24°C.";
  else if (isCold) hvacOptimization = "Heat pump cycle scheduled to 21°C. Retain solar envelope insulation layers.";

  return {
    summary: `Local microclimate analysis for ${city.name} indicates a temperature of ${currentTemp.toFixed(1)}°C with ${weather.current.cloud_cover}% cloud cover. Local synoptic systems predict ${isRainy ? "scattered moisture arrays and shower activity" : isWindy ? "strong pressure differentials driving moderate wind gusts" : "stable atmospheric columns with crisp, clear skies"}.`,
    funQuote: isRainy 
      ? "Life isn't about waiting for the storm to pass, it's about learning to dance in the rain." 
      : isHot 
      ? "A perfect summer day is when the sun is shining, the breeze is blowing, and the iced coffee is cold." 
      : "The air is beautiful, the wind is clean, and the microclimate is yours.",
    dressCode: {
      recommendation: isCold 
        ? "Heavy layered thermal outerwear with windbreaker insulation." 
        : isHot 
        ? "Loose, light, sweat-wicking synthetic fabrics with UV protections."
        : "Moderate utility wear. Smart denim, breathable light sweaters, and walking sneakers.",
      keyItems: isCold 
        ? ["Insulated puffer shell", "Fleece pull", "Warm knit beanie"] 
        : isHot 
        ? ["Wide-brim hat", "Polarized sunglasses", "Linen shirt"] 
        : ["Zip-up sport varsity", "Breathable socks", "Light utility vest"],
      comfortIndex
    },
    outdoorActivities: {
      suitabilityIndex: suitabilityScore,
      assessment,
      safeActivities
    },
    healthTips: {
      uvRisk,
      allergyPollen: isHot || isWindy ? "Elevated grass/tree pollen counts. Pack antihistamines." : "Low active plant spore counts. Easy breathing conditions.",
      wellnessAdvice: isHot 
        ? "Enforce fluid intake metrics. Sip water even in absence of acute thirst triggers." 
        : "Incorporate outdoor step counts to elevate natural daylight exposure levels."
    },
    travelSafety: {
      drivingConditions: isRainy ? "Mild traction hazards. Enforce double breaking distance ratios." : "Optimum dry track conditions. High visual horizons.",
      flightDelayHazard: isWindy ? "Minor wind shear alerts at local terminal gates. Check status." : "Symmetric pressure lines. Zero visual limits.",
      generalAdvice: "Aviation corridors are standard. Proceed with standard commuting files."
    },
    gardeningAdvice: {
      wateringNeeds: isRainy ? "Halt all irrigation routines. Let natural aquifers replenish soil." : "Elevated evaporative loss. Irrigate soil beds early.",
      frostRisk: currentTemp < 3,
      priorityTask: currentTemp < 3 ? "Wrap fragile flora in frost blankets." : isRainy ? "Monitor plant container drainage." : "Prune dry leaves and weeds."
    },
    homeEnergyOptimizer: {
      hvacOptimization,
      solarEfficiencyRatio: uvMax > 6 ? 0.95 : uvMax > 3 ? 0.70 : 0.40,
      applianceTip: isHot 
        ? "Defer high-wattage dryers or ovens to after-peak evening sectors." 
        : "Coordinate laundry cycles to match maximum solar production hours."
    }
  };
}
