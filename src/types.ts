export interface LocationResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  country_code: string;
  admin1?: string;
  timezone: string;
}

export interface CurrentWeatherData {
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  is_day: number;
  precipitation: number;
  rain: number;
  showers: number;
  snowfall: number;
  weather_code: number;
  cloud_cover: number;
  pressure_msl: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  time?: string;
}

export interface DailyWeatherData {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  apparent_temperature_max: number[];
  apparent_temperature_min: number[];
  sunrise: string[];
  sunset: string[];
  uv_index_max: number[];
  precipitation_sum: number[];
  rain_sum: number[];
  showers_sum: number[];
  snowfall_sum: number[];
  precipitation_probability_max: number[];
  wind_speed_10m_max: number[];
}

export interface HourlyWeatherData {
  time: string[];
  temperature_2m: number[];
  precipitation_probability: number[];
  weather_code: number[];
}

export interface WeatherData {
  latitude: number;
  longitude: number;
  timezone: string;
  elevation: number;
  current: CurrentWeatherData;
  daily: DailyWeatherData;
  hourly: HourlyWeatherData;
}

export interface DressCode {
  recommendation: string;
  keyItems: string[];
  comfortIndex: string;
}

export interface OutdoorActivities {
  suitabilityIndex: number;
  assessment: string;
  safeActivities: string[];
}

export interface HealthTips {
  uvRisk: string;
  allergyPollen: string;
  wellnessAdvice: string;
}

export interface TravelSafety {
  drivingConditions: string;
  flightDelayHazard: string;
  generalAdvice: string;
}

export interface GardeningAdvice {
  wateringNeeds: string;
  frostRisk: boolean;
  priorityTask: string;
}

export interface HomeEnergyOptimizer {
  hvacOptimization: string;
  solarEfficiencyRatio: number;
  applianceTip: string;
}

export interface AIIntelligence {
  summary: string;
  funQuote: string;
  dressCode: DressCode;
  outdoorActivities: OutdoorActivities;
  healthTips: HealthTips;
  travelSafety: TravelSafety;
  gardeningAdvice: GardeningAdvice;
  homeEnergyOptimizer: HomeEnergyOptimizer;
}
