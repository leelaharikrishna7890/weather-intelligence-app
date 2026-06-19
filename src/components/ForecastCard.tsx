import { DailyWeatherData } from "../types";
import { getWeatherCondition } from "../utils/weatherUtils";
import { Calendar, Umbrella, Sun, ChevronsRight } from "lucide-react";

interface ForecastCardProps {
  daily: DailyWeatherData;
  selectedDayIndex: number;
  onSelectDay: (idx: number) => void;
}

export function getDayName(dateString: string, isTodayOnly: boolean = false): string {
  const date = new Date(dateString);
  const today = new Date();
  
  if (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  ) {
    return "Today";
  }

  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear()
  ) {
    return "Tomorrow";
  }

  return date.toLocaleDateString([], { weekday: isTodayOnly ? "short" : "long" });
}

export default function ForecastCard({ daily, selectedDayIndex, onSelectDay }: ForecastCardProps) {
  // Map index elements
  const days = daily.time.map((dateStr, idx) => {
    const condition = getWeatherCondition(daily.weather_code[idx], true);
    return {
      index: idx,
      dateStr,
      dayLabelSingular: getDayName(dateStr, true),
      dayLabelFull: getDayName(dateStr, false),
      maxTemp: daily.temperature_2m_max[idx],
      minTemp: daily.temperature_2m_min[idx],
      condition,
      probMax: daily.precipitation_probability_max?.[idx] || 0,
    };
  });

  return (
    <div id="forecast-7-day-board" className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-sky-400" />
          <h3 className="font-sans font-medium tracking-tight text-slate-100">
            7-Day Synoptic Outlook
          </h3>
        </div>
        <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest">
          Interactively Select Card For Metrics
        </span>
      </div>

      {/* Horizontally scrollable row on mobile, bento flex-grid on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 pb-1 select-none">
        {days.map((day) => {
          const isSelected = selectedDayIndex === day.index;
          const WeatherIcon = day.condition.icon;

          return (
            <button
              key={day.index}
              onClick={() => onSelectDay(day.index)}
              className={`flex flex-col items-center justify-between p-4 rounded-2xl transition-all duration-300 border text-center cursor-pointer outline-none ${
                isSelected
                  ? "bg-slate-800/80 border-indigo-500 text-slate-50 scale-[1.02] shadow-[0_0_20px_rgba(99,102,241,0.15)]"
                  : "bento-card glass-shine text-slate-300"
              }`}
            >
              {/* Day Label */}
              <div className="flex flex-col items-center">
                <span className="font-sans font-semibold text-sm">
                  {day.dayLabelSingular}
                </span>
                <span className="text-[9px] font-mono text-slate-500 mt-0.5">
                  {new Date(day.dateStr).toLocaleDateString([], { month: "short", day: "numeric" })}
                </span>
              </div>

              {/* Weather Symbol */}
              <div className={`my-3 p-2.5 rounded-full ${isSelected ? "bg-indigo-500/15 text-indigo-400" : "bg-slate-950/40 text-slate-400"}`}>
                <WeatherIcon className="w-6 h-6 animate-pulse" />
              </div>

              {/* Temp boundaries */}
              <div className="flex flex-col items-center gap-0.5">
                <span className="font-sans text-sm font-bold text-slate-100">
                  {Math.round(day.maxTemp)}°
                </span>
                <span className="font-mono text-xs text-slate-500">
                  {Math.round(day.minTemp)}°
                </span>
              </div>

              {/* Rain Probability Badge */}
              {day.probMax > 0 ? (
                <div className="flex items-center gap-0.5 mt-2.5 text-[10px] text-blue-400 font-mono">
                  <Umbrella className="w-3 h-3 text-blue-400 shrink-0" />
                  <span>{day.probMax}%</span>
                </div>
              ) : (
                <div className="flex items-center gap-0.5 mt-2.5 text-[10px] text-slate-500 font-mono">
                  <Sun className="w-3 h-3 text-slate-500 shrink-0" />
                  <span>0%</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Day Details Showcase block */}
      <div className="bento-card glass-shine p-5 rounded-2xl">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono border-b border-slate-800 pb-2 mb-4">
          <div className="flex items-center gap-1.5">
            <ChevronsRight className="w-3.5 h-3.5 text-sky-400" />
            <span>METEOROLOGICAL SPECIFICS:</span>
            <span className="text-slate-200 font-semibold">{days[selectedDayIndex].dayLabelFull}</span>
          </div>
          <span>SATELLITE PROJECTIONS</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[10px] font-mono text-slate-505 tracking-wider font-bold">EXPECTED CONDITION</span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-sm font-semibold ${days[selectedDayIndex].condition.textAccentClass}`}>
                {days[selectedDayIndex].condition.label}
              </span>
            </div>
          </div>

          <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[10px] font-mono text-slate-505 tracking-wider font-bold">APPARENT BOUNDS</span>
            <p className="text-sm font-bold text-slate-200 mt-1">
              {Math.round(daily.apparent_temperature_min[selectedDayIndex])}°C to {Math.round(daily.apparent_temperature_max[selectedDayIndex])}°C
            </p>
          </div>

          <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[10px] font-mono text-slate-505 tracking-wider font-bold font-bold">UV INDEX RATING</span>
            <p className="text-sm font-semibold text-slate-200 mt-1">
              {daily.uv_index_max[selectedDayIndex]} Index (
              {daily.uv_index_max[selectedDayIndex] >= 8 ? "Very High" : daily.uv_index_max[selectedDayIndex] >= 6 ? "High" : daily.uv_index_max[selectedDayIndex] >= 3 ? "Moderate" : "Low"}
              )
            </p>
          </div>

          <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[10px] font-mono text-slate-505 tracking-wider font-bold">PRECIPITATION / WIND</span>
            <p className="text-sm font-sans font-medium text-slate-300 mt-1">
              {daily.precipitation_sum[selectedDayIndex]} mm sum / {daily.wind_speed_10m_max[selectedDayIndex]} km/h max
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
