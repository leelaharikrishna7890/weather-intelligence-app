import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Navigation,
  Cloudy, 
  Compass, 
  Sunrise, 
  Sunset, 
  CloudSnow,
  Sparkles,
  MapPin,
  Calendar,
  CloudLightning,
  Sun
} from "lucide-react";
import { CurrentWeatherData, DailyWeatherData, LocationResult } from "../types";
import { getWeatherCondition } from "../utils/weatherUtils";

interface DashboardProps {
  current: CurrentWeatherData;
  daily: DailyWeatherData;
  city: LocationResult;
  selectedDayIndex: number;
}

export default function Dashboard({ current, daily, city, selectedDayIndex }: DashboardProps) {
  // Use today's meteorological conditions
  const weatherCode = daily.weather_code[0];
  const isDay = current.is_day === 1;
  const condition = getWeatherCondition(current.weather_code || weatherCode, isDay);
  const IconComponent = condition.icon;

  // Format sunrise / sunset values
  const formatTime = (isoString?: string) => {
    if (!isoString) return "--:--";
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
    } catch {
      return "--:--";
    }
  };

  const sunriseStr = formatTime(daily.sunrise?.[0]);
  const sunsetStr = formatTime(daily.sunset?.[0]);

  return (
    <div id="weather-dashboard-viewport" className="space-y-6">
      {/* Dynamic Hero banner showcase and overview */}
      <div className={`relative rounded-3xl p-6 md:p-8 border bg-gradient-to-r ${condition.bgColorClass} border-slate-700/40 shadow-2xl transition-all duration-550 overflow-hidden bento-card glass-shine`}>
        {/* Dynamic Glowing Accent Background Sphere */}
        <div 
          className="absolute right-0 top-0 w-80 h-80 rounded-full blur-[80px] opacity-15 pointer-events-none transition-all duration-500"
          style={{ backgroundColor: condition.themeColor }}
        />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="p-1 px-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs font-mono text-slate-300 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>COORD: {city.latitude.toFixed(2)}°, {city.longitude.toFixed(2)}°</span>
              </span>
              <span className="bg-sky-400/10 border border-sky-400/20 rounded px-2.5 py-0.5 text-[9px] text-sky-400 font-mono tracking-wider">
                PERSISTENT TELEMETRY
              </span>
            </div>

            <div className="space-y-1.5">
              <span className="text-slate-450 font-mono text-xs uppercase tracking-widest block">
                CURRENT REPORT
              </span>
              <h2 className="font-sans font-bold text-3xl md:text-4xl text-white tracking-tight leading-tight text-gradient">
                {city.name}
              </h2>
              <p className="font-mono text-xs text-slate-400">
                {city.admin1 ? `${city.admin1}, ` : ""}{city.country}
              </p>
            </div>

            {/* Dynamic Status Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-2.5">
              <span className={`p-1 px-2.5 rounded-xl text-xs font-sans font-medium flex items-center gap-1 bg-slate-950/50 border border-slate-800/80 ${condition.textAccentClass}`}>
                <IconComponent className="w-4 h-4" />
                <span>{condition.label}</span>
              </span>
              <span className="p-1 px-2.5 rounded-xl text-xs font-sans font-medium bg-slate-950/50 border border-slate-800/80 text-slate-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</span>
              </span>
            </div>
          </div>

          {/* Heavy Temperature readout section */}
          <div className="flex items-center gap-5 md:gap-7 self-start md:self-center shrink-0">
            <div className="text-right">
              <span className="font-sans text-5xl md:text-7xl font-bold tracking-tighter text-white flex items-start justify-end text-gradient">
                {Math.round(current.temperature_2m)}
                <span className="text-2xl md:text-4xl font-light text-slate-400 ml-0.5">°C</span>
              </span>
              <div className="flex items-center justify-end gap-1.5 mt-1">
                <Thermometer className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <span className="text-xs font-mono text-slate-400">
                  Feels like <strong className="text-slate-200 font-semibold">{Math.round(current.apparent_temperature)}°C</strong>
                </span>
              </div>
            </div>

            {/* Extreme visual highlight box */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-center">
              <IconComponent className="w-12 h-12 md:w-16 md:h-16 text-zinc-100 animate-pulse" style={{ color: condition.themeColor }} />
            </div>
          </div>
        </div>
      </div>

      {/* Meteorological Bento cards panel */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
        {/* Feels Like apparent details */}
        <div className="bento-card glass-shine p-4 rounded-2xl flex flex-col justify-between hover:border-slate-500/50 transition-all">
          <div className="flex items-center justify-between opacity-80 mb-2">
            <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase font-bold">Apparent Heat</span>
            <Thermometer className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <span className="text-lg font-sans font-bold text-slate-100 block">
              {Math.round(current.apparent_temperature)}°C
            </span>
            <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
              Ref Temp: {current.temperature_2m}°C
            </span>
          </div>
        </div>

        {/* Absolute Air humidity */}
        <div className="bento-card glass-shine p-4 rounded-2xl flex flex-col justify-between hover:border-slate-500/50 transition-all">
          <div className="flex items-center justify-between opacity-80 mb-2">
            <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase font-bold">Air Humidity</span>
            <Droplets className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <span className="text-lg font-sans font-bold text-slate-100 block">
              {current.relative_humidity_2m}%
            </span>
            <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
              Dew pt: {Math.round(current.temperature_2m - (100 - current.relative_humidity_2m)/5)}°C
            </span>
          </div>
        </div>

        {/* Dynamic compass rotary wind speed indicator */}
        <div className="bento-card glass-shine p-4 rounded-2xl flex flex-col justify-between hover:border-slate-500/50 transition-all">
          <div className="flex items-center justify-between opacity-80 mb-2">
            <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase font-bold">Kinetic Wind</span>
            <Wind className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <span className="text-lg font-sans font-bold text-slate-100 block">
                {current.wind_speed_10m} <span className="text-xs font-normal text-slate-400">km/h</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                Wind Dir: {current.wind_direction_10m}°
              </span>
            </div>
            
            {/* Awesome Wind Compass Pointer */}
            <div className="p-1 rounded-full bg-slate-950/60 border border-slate-800 text-slate-300 w-7 h-7 flex items-center justify-center shrink-0">
              <Navigation 
                className="w-4 h-4 text-indigo-300 transition-transform duration-700 ease-out" 
                style={{ transform: `rotate(${current.wind_direction_10m}deg)` }} 
                title="True wind direction"
              />
            </div>
          </div>
        </div>

        {/* Cloud coverage details */}
        <div className="bento-card glass-shine p-4 rounded-2xl flex flex-col justify-between hover:border-slate-500/50 transition-all">
          <div className="flex items-center justify-between opacity-80 mb-2">
            <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase font-bold">Sky Coverage</span>
            <Cloudy className="w-4 h-4 text-slate-300" />
          </div>
          <div>
            <span className="text-lg font-sans font-bold text-slate-100 block">
              {current.cloud_cover}%
            </span>
            <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
              {current.cloud_cover >= 80 ? "Fully Overcast" : current.cloud_cover >= 50 ? "Scattered Clouds" : current.cloud_cover >= 20 ? "Partly clear" : "Excellent clear skies"}
            </span>
          </div>
        </div>

        {/* Astrometric pressure barometrics */}
        <div className="bento-card glass-shine p-4 rounded-2xl flex flex-col justify-between hover:border-slate-500/50 transition-all">
          <div className="flex items-center justify-between opacity-80 mb-2">
            <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase font-bold">Atm Pressure</span>
            <Compass className="w-4 h-4 text-teal-400" />
          </div>
          <div>
            <span className="text-lg font-sans font-bold text-slate-100 block">
              {Math.round(current.pressure_msl)} <span className="text-xs font-normal text-slate-400">hPa</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
              Sea pressure level
            </span>
          </div>
        </div>

        {/* Astronomics Sunrise Sunset tracker */}
        <div className="bento-card glass-shine p-4 rounded-2xl flex flex-col justify-between hover:border-slate-500/50 transition-all">
          <div className="flex items-center justify-between opacity-80 mb-2">
            <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase font-bold">Solar events</span>
            <Sun className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-300">
              <Sunrise className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
              <span>Rise: <strong className="font-mono text-slate-205">{sunriseStr}</strong></span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-300">
              <Sunset className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>Set: <strong className="font-mono text-slate-205">{sunsetStr}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
