import React, { useState, useRef, useEffect } from "react";
import { DailyWeatherData } from "../types";
import { TrendingUp, Thermometer, CloudRain, Wind, HelpCircle, Calendar } from "lucide-react";
import { getDayName } from "./ForecastCard";

interface ForecastAndTrendsChartProps {
  daily: DailyWeatherData;
}

type TabType = "temperature" | "precipitation" | "wind";

export default function ForecastAndTrendsChart({ daily }: ForecastAndTrendsChartProps) {
  const [activeTab, setActiveTab] = useState<TabType>("temperature");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 220 });

  // Handle dynamic SVG resizing
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        setDimensions({
          width: Math.max(width, 300),
          height: 200,
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const daysCount = daily.time.length;
  
  // Format items
  const forecastPoints = daily.time.map((dateStr, idx) => {
    const d = new Date(dateStr);
    return {
      index: idx,
      dateLabel: d.toLocaleDateString([], { month: "short", day: "numeric" }),
      dayLabel: getDayName(dateStr, true),
      tempMax: daily.temperature_2m_max[idx],
      tempMin: daily.temperature_2m_min[idx],
      precipProb: daily.precipitation_probability_max?.[idx] || 0,
      precipSum: daily.precipitation_sum?.[idx] || 0,
      windSpeed: daily.wind_speed_10m_max?.[idx] || 0,
    };
  });

  const width = dimensions.width;
  const height = dimensions.height;
  const padding = { left: 45, right: 30, top: 25, bottom: 35 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculators
  const getX = (idx: number) => {
    if (daysCount <= 1) return padding.left + chartWidth / 2;
    return padding.left + (idx / (daysCount - 1)) * chartWidth;
  };

  // 1. Temperature scales
  const allMaxTemps = forecastPoints.map((p) => p.tempMax);
  const allMinTemps = forecastPoints.map((p) => p.tempMin);
  const absoluteMaxTemp = Math.max(...allMaxTemps, 20); // enforce a min ceiling for plotting safety
  const absoluteMinTemp = Math.min(...allMinTemps, 0);   // enforce a min floor
  const tempRange = absoluteMaxTemp - absoluteMinTemp === 0 ? 1 : absoluteMaxTemp - absoluteMinTemp;

  const getYTemp = (temp: number) => {
    const ratio = (temp - absoluteMinTemp) / tempRange;
    return padding.top + chartHeight - ratio * chartHeight;
  };

  // 2. Precipitation scales
  const allPrecipSums = forecastPoints.map((p) => p.precipSum);
  const maxPrecipSum = Math.max(...allPrecipSums, 5); // safety floor
  const getYPrecipProb = (prob: number) => {
    const ratio = prob / 100;
    return padding.top + chartHeight - ratio * chartHeight;
  };
  const getYPrecipSum = (sum: number) => {
    const ratio = sum / maxPrecipSum;
    return padding.top + chartHeight - ratio * chartHeight;
  };

  // 3. Wind scales
  const allWindSpeeds = forecastPoints.map((p) => p.windSpeed);
  const maxWindSpeed = Math.max(...allWindSpeeds, 15); // safety floor 
  const getYWind = (wind: number) => {
    const ratio = wind / maxWindSpeed;
    return padding.top + chartHeight - ratio * chartHeight;
  };

  // Generate path lines based on active tabs
  let maxTempLine = "";
  let minTempLine = "";
  let tempAreaPath = "";
  let precipProbLine = "";
  let precipSumLine = "";
  let windLine = "";
  let windAreaPath = "";

  if (forecastPoints.length > 0) {
    // Temp curves
    forecastPoints.forEach((p, idx) => {
      const x = getX(idx);
      const yMax = getYTemp(p.tempMax);
      const yMin = getYTemp(p.tempMin);
      
      if (idx === 0) {
        maxTempLine += `M ${x} ${yMax}`;
        minTempLine += `M ${x} ${yMin}`;
        tempAreaPath += `M ${x} ${yMin} L ${x} ${yMax}`;
      } else {
        maxTempLine += ` L ${x} ${yMax}`;
        minTempLine += ` L ${x} ${yMin}`;
      }
    });
    // Create sandwich polyline for temp range area
    for (let i = forecastPoints.length - 1; i >= 0; i--) {
      const x = getX(i);
      const yMin = getYTemp(forecastPoints[i].tempMin);
      tempAreaPath += ` L ${x} ${yMin}`;
    }
    for (let i = 0; i < forecastPoints.length; i++) {
      const x = getX(i);
      const yMax = getYTemp(forecastPoints[i].tempMax);
      tempAreaPath += ` L ${x} ${yMax}`;
    }
    tempAreaPath += " Z";

    // Precipitation curves
    forecastPoints.forEach((p, idx) => {
      const x = getX(idx);
      const yProb = getYPrecipProb(p.precipProb);
      const ySum = getYPrecipSum(p.precipSum);

      if (idx === 0) {
        precipProbLine += `M ${x} ${yProb}`;
        precipSumLine += `M ${x} ${ySum}`;
      } else {
        precipProbLine += ` L ${x} ${yProb}`;
        precipSumLine += ` L ${x} ${ySum}`;
      }
    });

    // Wind curves
    forecastPoints.forEach((p, idx) => {
      const x = getX(idx);
      const yWind = getYWind(p.windSpeed);

      if (idx === 0) {
        windLine += `M ${x} ${yWind}`;
        windAreaPath += `M ${x} ${padding.top + chartHeight} L ${x} ${yWind}`;
      } else {
        windLine += ` L ${x} ${yWind}`;
        windAreaPath += ` L ${x} ${yWind}`;
      }
    });
    windAreaPath += ` L ${getX(forecastPoints.length - 1)} ${padding.top + chartHeight} Z`;
  }

  // Pointer hover controller
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!containerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPos = e.clientX - rect.left - padding.left;
    const itemWidth = chartWidth / (daysCount - 1);
    const rawIdx = Math.round(xPos / itemWidth);
    const finalIdx = Math.max(0, Math.min(daysCount - 1, rawIdx));
    setHoveredIndex(finalIdx);
  };

  const currentHoveredPoint = hoveredIndex !== null ? forecastPoints[hoveredIndex] : null;

  return (
    <div id="forecast-trends-panel" className="bento-card glass-shine p-5 md:p-6 space-y-4">
      
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-400 animate-pulse" />
          <div>
            <h3 className="font-sans font-bold tracking-tight text-slate-100 text-sm md:text-base">
              Synoptic Trend Engine
            </h3>
            <p className="text-[10px] text-slate-450 font-mono mt-0.5">
              FORECAST METRIC OVERVIEW
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center bg-slate-950/60 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => { setActiveTab("temperature"); setHoveredIndex(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-all duration-200 cursor-pointer ${
              activeTab === "temperature"
                ? "bg-indigo-500/10 border border-indigo-500/20 text-indigo-300"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" />
            <span>Temperature</span>
          </button>
          
          <button
            onClick={() => { setActiveTab("precipitation"); setHoveredIndex(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-all duration-200 cursor-pointer ${
              activeTab === "precipitation"
                ? "bg-blue-500/10 border border-blue-500/20 text-blue-300"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span>Rain Risk</span>
          </button>

          <button
            onClick={() => { setActiveTab("wind"); setHoveredIndex(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-all duration-200 cursor-pointer ${
              activeTab === "wind"
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>Wind Speed</span>
          </button>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div 
        ref={containerRef} 
        className="w-full relative h-[180px] md:h-[200px] select-none"
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <svg 
          width="100%" 
          height="100%" 
          viewBox={`0 0 ${width} ${height}`} 
          preserveAspectRatio="none" 
          className="overflow-visible"
          onMouseMove={handleMouseMove}
        >
          {/* Defs/Gradients */}
          <defs>
            <linearGradient id="tempAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818cf8" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#312e81" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="precipAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="windAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#064e3b" stopOpacity={0.0} />
            </linearGradient>
          </defs>

          {/* Grid lines (Horizontals) */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
            const y = padding.top + ratio * chartHeight;
            let gridValueLabel = "";

            if (activeTab === "temperature") {
              gridValueLabel = `${Math.round(absoluteMaxTemp - ratio * tempRange)}°C`;
            } else if (activeTab === "precipitation") {
              gridValueLabel = `${Math.round(100 - ratio * 100)}%`;
            } else {
              gridValueLabel = `${Math.round(maxWindSpeed - ratio * maxWindSpeed)} km/h`;
            }

            return (
              <g key={index} opacity={0.15}>
                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#e2e8f0" strokeWidth={1} strokeDasharray="3,3" />
                <text x={padding.left - 8} y={y + 3} textAnchor="end" fontSize="9" fontFamily="monospace" fill="#94a3b8" className="font-bold">
                  {gridValueLabel}
                </text>
              </g>
            );
          })}

          {/* Hover Tracker Guide Line */}
          {hoveredIndex !== null && (
            <line 
              x1={getX(hoveredIndex)} 
              y1={padding.top} 
              x2={getX(hoveredIndex)} 
              y2={padding.top + chartHeight} 
              stroke="#cbd5e1" 
              strokeWidth={1.5} 
              strokeOpacity={0.3}
              strokeDasharray="2,2" 
            />
          )}

          {/* RENDER CHOSEN CHART */}
          {activeTab === "temperature" && (
            <>
              {/* Temperature sandwich area representing variation block */}
              <path d={tempAreaPath} fill="url(#tempAreaGrad)" opacity={0.7} />
              <path d={maxTempLine} fill="none" stroke="#f43f5e" strokeWidth={2.5} strokeLinecap="round" />
              <path d={minTempLine} fill="none" stroke="#60a5fa" strokeWidth={2} strokeLinecap="round" strokeDasharray="2,2" />
              
              {/* Data dots */}
              {forecastPoints.map((p, idx) => (
                <g key={idx} opacity={hoveredIndex === null || hoveredIndex === idx ? 1 : 0.4}>
                  <circle cx={getX(idx)} cy={getYTemp(p.tempMax)} r={hoveredIndex === idx ? 4.5 : 3.5} fill="#f43f5e" stroke="#1e293b" strokeWidth={1} />
                  <circle cx={getX(idx)} cy={getYTemp(p.tempMin)} r={hoveredIndex === idx ? 4 : 3} fill="#60a5fa" stroke="#1e293b" strokeWidth={1} />
                </g>
              ))}
            </>
          )}

          {activeTab === "precipitation" && (
            <>
              {/* Bar charts representing rain totals, overlayed with precipitation risk probability line */}
              {forecastPoints.map((p, idx) => {
                const barWidth = Math.max(12, chartWidth / daysCount * 0.4);
                const barX = getX(idx) - barWidth / 2;
                const barY = getYPrecipSum(p.precipSum);
                const barH = padding.top + chartHeight - barY;

                return (
                  <rect 
                    key={`bar-${idx}`} 
                    x={barX} 
                    y={barY} 
                    width={barWidth} 
                    height={Math.max(1, barH)} 
                    fill="url(#precipAreaGrad)" 
                    stroke="#2563eb" 
                    strokeWidth={1}
                    opacity={hoveredIndex === null || hoveredIndex === idx ? 0.8 : 0.3}
                    rx="2"
                  />
                );
              })}

              {/* Rain Probability max curve */}
              <path d={precipProbLine} fill="none" stroke="#3b82f6" strokeWidth={2.5} strokeLinejoin="round" />

              {/* Data dots */}
              {forecastPoints.map((p, idx) => (
                <circle 
                  key={`dot-${idx}`} 
                  cx={getX(idx)} 
                  cy={getYPrecipProb(p.precipProb)} 
                  r={hoveredIndex === idx ? 4.5 : 3.5} 
                  fill="#60a5fa" 
                  stroke="#1e293b" 
                  strokeWidth={1} 
                  opacity={hoveredIndex === null || hoveredIndex === idx ? 1 : 0.4}
                />
              ))}
            </>
          )}

          {activeTab === "wind" && (
            <>
              <path d={windAreaPath} fill="url(#windAreaGrad)" opacity={0.65} />
              <path d={windLine} fill="none" stroke="#10b981" strokeWidth={2.5} strokeLinecap="round" />

              {/* Data dots */}
              {forecastPoints.map((p, idx) => (
                <circle 
                  key={`dot-${idx}`} 
                  cx={getX(idx)} 
                  cy={getYWind(p.windSpeed)} 
                  r={hoveredIndex === idx ? 5 : 3.5} 
                  fill="#10b981" 
                  stroke="#1e293b" 
                  strokeWidth={1} 
                  opacity={hoveredIndex === null || hoveredIndex === idx ? 1 : 0.4}
                />
              ))}
            </>
          )}

          {/* X Axis Labels */}
          {forecastPoints.map((p, idx) => {
            const x = getX(idx);
            return (
              <g key={idx} opacity={0.6}>
                <text x={x} y={height - 20} textAnchor="middle" fontSize="9.5" fill="#e2e8f0" fontFamily="sans-serif" className="font-semibold">
                  {p.dayLabel}
                </text>
                <text x={x} y={height - 8} textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="monospace">
                  {p.dateLabel}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Hover Info Summary Panel */}
      <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex flex-wrap md:flex-nowrap items-center justify-between gap-3 text-xs">
        {currentHoveredPoint ? (
          <>
            <div className="flex items-center gap-1.5 font-sans font-medium text-slate-100">
              <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>Details for {currentHoveredPoint.dayLabel} ({currentHoveredPoint.dateLabel}):</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 font-mono text-[11px]">
              <div className="flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="text-slate-400">Temp:</span>
                <strong className="text-slate-200 font-bold">{Math.round(currentHoveredPoint.tempMin)}°C to {Math.round(currentHoveredPoint.tempMax)}°C</strong>
              </div>
              
              <div className="flex items-center gap-1">
                <CloudRain className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="text-slate-400">Rain Risk:</span>
                <strong className="text-blue-350 font-bold">{currentHoveredPoint.precipProb}% ({currentHoveredPoint.precipSum}mm)</strong>
              </div>

              <div className="flex items-center gap-1">
                <Wind className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-slate-400">Wind:</span>
                <strong className="text-emerald-300 font-bold">{Math.round(currentHoveredPoint.windSpeed)} km/h</strong>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 text-slate-450 font-sans mx-auto py-1">
            <HelpCircle className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Hover or slide over points on the graph for synoptic projections.</span>
          </div>
        )}
      </div>
    </div>
  );
}
