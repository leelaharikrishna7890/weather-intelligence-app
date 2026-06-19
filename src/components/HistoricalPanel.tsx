import React, { useState, useEffect, useRef } from "react";
import { LocationResult } from "../types";
import { 
  History, 
  Calendar, 
  Search, 
  Thermometer, 
  CloudRain, 
  Wind, 
  Loader2, 
  ChevronRight, 
  TrendingUp, 
  Sparkles,
  HelpCircle
} from "lucide-react";

interface HistoricalPanelProps {
  city: LocationResult;
}

interface HistoricalDataState {
  time: string[];
  tempMax: number[];
  tempMin: number[];
  tempMean: number[];
  precipSum: number[];
  windMax: number[];
}

export default function HistoricalPanel({ city }: HistoricalPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalDataState | null>(null);

  // Predefined or custom dates state
  const [selectedRange, setSelectedRange] = useState<"last-month" | "last-3-months" | "last-year-month" | "custom">("last-month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const [svgDimensions, setSvgDimensions] = useState({ width: 500, height: 160 });

  // Watch component width for chart responsiveness
  useEffect(() => {
    if (!svgContainerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setSvgDimensions({
          width: Math.max(entry.contentRect.width, 250),
          height: 150,
        });
      }
    });
    resizeObserver.observe(svgContainerRef.current);
    return () => resizeObserver.disconnect();
  }, [historicalData]);

  // Compute boundaries
  const getDatesForRange = (range: string) => {
    const today = new Date();
    let start = "";
    let end = "";

    // Archive safe buffer: Open-Meteo archive is reliable up to 5 days ago
    const bufferDate = new Date();
    bufferDate.setDate(today.getDate() - 5);

    if (range === "last-month") {
      // Last completed calendar month
      const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const prevMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
      
      start = formatDateString(prevMonth);
      end = formatDateString(prevMonthEnd);
    } else if (range === "last-3-months") {
      const prevMonthsStart = new Date(today.getFullYear(), today.getMonth() - 3, 1);
      const prevMonthsEnd = new Date(today.getFullYear(), today.getMonth(), 0);
      
      start = formatDateString(prevMonthsStart);
      end = formatDateString(prevMonthsEnd);
    } else if (range === "last-year-month") {
      // Same month last year
      const lastYearMonthStart = new Date(today.getFullYear() - 1, today.getMonth(), 1);
      const lastYearMonthEnd = new Date(today.getFullYear() - 1, today.getMonth() + 1, 0);
      
      start = formatDateString(lastYearMonthStart);
      end = formatDateString(lastYearMonthEnd);
    } else {
      start = customStartDate;
      end = customEndDate;
    }

    return { start, end };
  };

  const formatDateString = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Run the historical archival queries
  const fetchHistoricalWeather = async () => {
    setLoading(true);
    setError(null);
    setHistoricalData(null);
    setHoveredIdx(null);

    const { start, end } = getDatesForRange(selectedRange);

    if (!start || !end) {
      setError("Please select both a start date and an end date.");
      setLoading(false);
      return;
    }

    // Basic date validations
    const sDate = new Date(start);
    const eDate = new Date(end);
    if (sDate > eDate) {
      setError("Start date cannot occur after end date.");
      setLoading(false);
      return;
    }

    // Limit date selection range to 180 days to prevent Open-Meteo throttling
    const diffTime = Math.abs(eDate.getTime() - sDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 366) {
      setError("Please limit date ranges to 1 year or less for synoptic fidelity.");
      setLoading(false);
      return;
    }

    // Guard future queries
    const maxAllowedDate = new Date();
    maxAllowedDate.setDate(maxAllowedDate.getDate() - 3); // 3 days ago is standard archive bounds
    if (eDate > maxAllowedDate) {
      setError(`Historical archive available up to 3 days ago (${formatDateString(maxAllowedDate)}). Please adjust.`);
      setLoading(false);
      return;
    }

    try {
      const url = `/api/weather/historical?lat=${city.latitude}&lon=${city.longitude}&start_date=${start}&end_date=${end}&timezone=${encodeURIComponent(city.timezone)}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to load historical charts (Status: ${res.status})`);
      }
      const data = await res.json();
      
      if (!data.daily || !data.daily.time || data.daily.time.length === 0) {
        throw new Error("No daily archival telemetry recorded for this range.");
      }

      setHistoricalData({
        time: data.daily.time,
        tempMax: data.daily.temperature_2m_max || [],
        tempMin: data.daily.temperature_2m_min || [],
        tempMean: data.daily.temperature_2m_mean || [],
        precipSum: data.daily.precipitation_sum || [],
        windMax: data.daily.wind_speed_10m_max || [],
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Archive coordinate link timeout.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch automatically on city change or range change
  useEffect(() => {
    if (selectedRange !== "custom") {
      fetchHistoricalWeather();
    } else {
      // Set default placeholders for custom
      const today = new Date();
      const pastStart = new Date();
      pastStart.setDate(today.getDate() - 30);
      const pastEnd = new Date();
      pastEnd.setDate(today.getDate() - 5);

      setCustomStartDate(formatDateString(pastStart));
      setCustomEndDate(formatDateString(pastEnd));
    }
  }, [city, selectedRange]);

  // Calculations for summarized metrics
  const getMetricsSummary = () => {
    if (!historicalData) return null;
    
    const temps = historicalData.tempMean.filter(v => v !== null);
    const maxTemps = historicalData.tempMax.filter(v => v !== null);
    const minTemps = historicalData.tempMin.filter(v => v !== null);
    const precips = historicalData.precipSum.filter(v => v !== null);
    const winds = historicalData.windMax.filter(v => v !== null);

    const avgTemp = temps.length > 0 ? temps.reduce((a, b) => a + b, 0) / temps.length : 0;
    const avgMaxTemp = maxTemps.length > 0 ? maxTemps.reduce((a, b) => a + b, 0) / maxTemps.length : 0;
    const avgMinTemp = minTemps.length > 0 ? minTemps.reduce((a, b) => a + b, 0) / minTemps.length : 0;
    const totalPrecip = precips.reduce((a, b) => a + b, 0);
    const maxWind = winds.length > 0 ? Math.max(...winds) : 0;
    const avgWind = winds.length > 0 ? winds.reduce((a, b) => a + b, 0) / winds.length : 0;

    // Days count with rain
    const rainDays = precips.filter(p => p > 0.1).length;

    return {
      avgTemp,
      avgMaxTemp,
      avgMinTemp,
      totalPrecip,
      maxWind,
      avgWind,
      rainDays,
      totalDays: historicalData.time.length
    };
  };

  const metrics = getMetricsSummary();

  // Create SVG points
  const drawHistoricalSvg = () => {
    if (!historicalData || historicalData.time.length === 0) return null;

    const dataCount = historicalData.time.length;
    const w = svgDimensions.width;
    const h = svgDimensions.height;
    const pad = { left: 35, right: 15, top: 15, bottom: 25 };
    const chartW = w - pad.left - pad.right;
    const chartH = h - pad.top - pad.bottom;

    const means = historicalData.tempMean;
    const maxTemp = Math.max(...historicalData.tempMax, 15);
    const minTemp = Math.min(...historicalData.tempMin, 0);
    const tempRange = maxTemp - minTemp === 0 ? 1 : maxTemp - minTemp;

    const getXCoord = (idx: number) => {
      if (dataCount <= 1) return pad.left + chartW / 2;
      return pad.left + (idx / (dataCount - 1)) * chartW;
    };

    const getYCoord = (temp: number) => {
      const ratio = (temp - minTemp) / tempRange;
      return pad.top + chartH - ratio * chartH;
    };

    // Mean Temperature Line Path
    let meanLinePath = "";
    let maxLinePath = "";
    let minLinePath = "";
    means.forEach((temp, i) => {
      const x = getXCoord(i);
      const yMean = getYCoord(temp);
      const yMax = getYCoord(historicalData.tempMax[i]);
      const yMin = getYCoord(historicalData.tempMin[i]);

      if (i === 0) {
        meanLinePath += `M ${x} ${yMean}`;
        maxLinePath += `M ${x} ${yMax}`;
        minLinePath += `M ${x} ${yMin}`;
      } else {
        meanLinePath += ` L ${x} ${yMean}`;
        maxLinePath += ` L ${x} ${yMax}`;
        minLinePath += ` L ${x} ${yMin}`;
      }
    });

    const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const xOffset = e.clientX - rect.left - pad.left;
      const pointW = chartW / (dataCount - 1);
      const approxIdx = Math.round(xOffset / pointW);
      const finalIdx = Math.max(0, Math.min(dataCount - 1, approxIdx));
      setHoveredIdx(finalIdx);
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-400" />
            <span>Daily Mean (°C)</span>
            <span className="w-1.5 h-1.5 bg-rose-400/50 rounded-full ml-2" />
            <span>Max Bounds</span>
            <span className="w-1.5 h-1.5 bg-blue-400/50 rounded-full ml-1" />
            <span>Min Bounds</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {dataCount} LOGGED DATAPoints
          </span>
        </div>

        <div className="relative overflow-visible" onMouseLeave={() => setHoveredIdx(null)}>
          <svg 
            width="100%" 
            height={h} 
            viewBox={`0 0 ${w} ${h}`} 
            preserveAspectRatio="none"
            className="overflow-visible select-none"
            onMouseMove={handleSvgMouseMove}
          >
            {/* Grid references */}
            {[0, 0.5, 1].map((ratio, index) => {
              const y = pad.top + ratio * chartH;
              const val = maxTemp - ratio * tempRange;
              return (
                <g key={index} opacity={0.1}>
                  <line x1={pad.left} y1={y} x2={w - pad.right} y2={y} stroke="#cbd5e1" strokeWidth={1} strokeDasharray="3,3" />
                  <text x={pad.left - 6} y={y + 3} textAnchor="end" fontSize="8" fontFamily="monospace" fill="#e2e8f0">
                    {Math.round(val)}°
                  </text>
                </g>
              );
            })}

            {/* Guides lines on hover */}
            {hoveredIdx !== null && (
              <line 
                x1={getXCoord(hoveredIdx)} 
                y1={pad.top} 
                x2={getXCoord(hoveredIdx)} 
                y2={pad.top + chartH} 
                stroke="#64748b" 
                strokeWidth={1} 
                strokeOpacity={0.4}
                strokeDasharray="2,2" 
              />
            )}

            {/* Boundary Curves */}
            <path d={maxLinePath} fill="none" stroke="#f43f5e" strokeWidth={1} strokeDasharray="2,2" opacity={0.35} />
            <path d={minLinePath} fill="none" stroke="#60a5fa" strokeWidth={1} strokeDasharray="2,2" opacity={0.35} />

            {/* Mean Temperature Line */}
            <path d={meanLinePath} fill="none" stroke="#8b5cf6" strokeWidth={2.5} strokeLinejoin="round" />

            {/* Mean highlights */}
            {hoveredIdx !== null && (
              <>
                <circle cx={getXCoord(hoveredIdx)} cy={getYCoord(historicalData.tempMean[hoveredIdx])} r={4.5} fill="#8b5cf6" stroke="#1e293b" strokeWidth={1.5} />
                <circle cx={getXCoord(getXCoord(hoveredIdx))} cy={getYCoord(historicalData.tempMax[hoveredIdx])} r={3} fill="#f43f5e" />
                <circle cx={getXCoord(getXCoord(hoveredIdx))} cy={getYCoord(historicalData.tempMin[hoveredIdx])} r={3} fill="#60a5fa" />
              </>
            )}

            {/* Simple endpoint start/end axis labels */}
            <text x={pad.left} y={h - 4} textAnchor="start" fontSize="8" fill="#64748b" fontFamily="monospace">
              {historicalData.time[0]}
            </text>
            <text x={w - pad.right} y={h - 4} textAnchor="end" fontSize="8" fill="#64748b" fontFamily="monospace">
              {historicalData.time[dataCount - 1]}
            </text>
          </svg>
        </div>

        {/* Hover info log */}
        <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-xs flex items-center justify-between">
          {hoveredIdx !== null ? (
            <>
              <span className="font-sans font-medium text-slate-300">
                Date: <strong className="text-slate-100">{historicalData.time[hoveredIdx]}</strong>
              </span>
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span className="text-purple-300">Avg: {historicalData.tempMean[hoveredIdx]}°C</span>
                <span className="text-rose-450">Max: {historicalData.tempMax[hoveredIdx]}°C</span>
                <span className="text-sky-400">Min: {historicalData.tempMin[hoveredIdx]}°C</span>
                <span className="text-blue-400">Precip: {historicalData.precipSum[hoveredIdx]}mm</span>
              </div>
            </>
          ) : (
            <span className="text-slate-500 font-sans text-[10.5px] mx-auto">
              Slide cursor across the chart coordinate matrix for detailed day telemetry stats.
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div id="historical-intelligence-center" className="bento-card glass-shine p-5 md:p-6 space-y-5">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="font-sans font-bold text-slate-100 tracking-tight text-sm md:text-base">
              Archival Climate Intelligence
            </h3>
            <p className="text-[10px] text-slate-500 font-mono">
              HISTORICAL WEATHER COMPACT ANALYZER
            </p>
          </div>
        </div>

        {/* Predefined Range Buttons */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850/80 text-[11px] self-start sm:self-center font-sans">
          <button
            onClick={() => setSelectedRange("last-month")}
            className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-all ${
              selectedRange === "last-month" ? "bg-slate-800 text-slate-100 font-semibold" : "text-slate-400 hover:text-slate-205"
            }`}
          >
            Last Month
          </button>
          <button
            onClick={() => setSelectedRange("last-3-months")}
            className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-all ${
              selectedRange === "last-3-months" ? "bg-slate-800 text-slate-100 font-semibold" : "text-slate-400 hover:text-slate-205"
            }`}
          >
            Last 3 Months
          </button>
          <button
            onClick={() => setSelectedRange("last-year-month")}
            className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-all ${
              selectedRange === "last-year-month" ? "bg-slate-800 text-slate-100 font-semibold" : "text-slate-400 hover:text-slate-205"
            }`}
          >
            Last Year Same Month
          </button>
          <button
            onClick={() => setSelectedRange("custom")}
            className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-all ${
              selectedRange === "custom" ? "bg-slate-800 text-slate-100 font-semibold" : "text-slate-400 hover:text-slate-205"
            }`}
          >
            Custom
          </button>
        </div>
      </div>

      {/* Custom Picker Panel */}
      {selectedRange === "custom" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/40 p-4 rounded-xl border border-slate-850">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Start date</span>
            <input 
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 uppercase font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold">End date</span>
            <input 
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 uppercase font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchHistoricalWeather}
              disabled={loading}
              className="w-full bg-indigo-500 hover:bg-indigo-600 border border-indigo-400/20 text-white font-medium text-xs rounded-lg py-2 cursor-pointer transition-all flex items-center justify-center gap-1"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Query Climate Archive</span>
            </button>
          </div>
        </div>
      )}

      {/* Main viewport */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-450 mb-3" />
          <p className="text-slate-300 font-sans text-sm font-medium">Downloading archival weather matrix...</p>
          <p className="text-slate-500 font-mono text-xs mt-1">Connecting to Open-Meteo ERA5 climate models</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl border border-rose-500/10 bg-rose-500/5 text-center text-xs text-rose-300 font-medium">
          ⚠️ {error}
        </div>
      ) : historicalData && metrics ? (
        <div className="space-y-5">
          {/* Bento stats grid overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Avg Temp */}
            <div className="bg-slate-950/40 border border-slate-850 p-3.5 rounded-xl">
              <div className="flex items-center justify-between text-slate-500 uppercase font-mono text-[9px] font-bold">
                <span>Avg Temperature</span>
                <Thermometer className="w-3.5 h-3.5 text-orange-400" />
              </div>
              <span className="text-xl font-sans font-bold text-slate-100 block mt-1.5">
                {metrics.avgTemp.toFixed(1)}°C
              </span>
              <span className="text-[9.5px] font-mono text-slate-500 block mt-0.5">
                Limits: {metrics.avgMinTemp.toFixed(0)}° to {metrics.avgMaxTemp.toFixed(0)}°
              </span>
            </div>

            {/* Total Rainfall */}
            <div className="bg-slate-950/40 border border-slate-850 p-3.5 rounded-xl">
              <div className="flex items-center justify-between text-slate-500 uppercase font-mono text-[9px] font-bold">
                <span>Precipitation Sum</span>
                <CloudRain className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <span className="text-xl font-sans font-bold text-slate-100 block mt-1.5">
                {metrics.totalPrecip.toFixed(1)} <span className="text-xs font-normal">mm</span>
              </span>
              <span className="text-[9.5px] font-mono text-slate-500 block mt-0.5">
                In {metrics.rainDays} of {metrics.totalDays} days
              </span>
            </div>

            {/* Max Wind speed */}
            <div className="bg-slate-950/40 border border-slate-850 p-3.5 rounded-xl">
              <div className="flex items-center justify-between text-slate-500 uppercase font-mono text-[9px] font-bold">
                <span>Peak Storm Gusts</span>
                <Wind className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span className="text-xl font-sans font-bold text-slate-100 block mt-1.5">
                {metrics.maxWind.toFixed(1)} <span className="text-xs font-normal">km/h</span>
              </span>
              <span className="text-[9.5px] font-mono text-slate-500 block mt-0.5">
                Avg: {metrics.avgWind.toFixed(1)} km/h
              </span>
            </div>

            {/* Climate summary brief */}
            <div className="bg-slate-950/40 border border-slate-850 p-3.5 rounded-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 uppercase font-mono text-[9px] font-bold">
                <span>Climate Profile</span>
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <p className="text-[11px] font-sans text-slate-300 font-medium leading-normal mt-1 grow flex items-center">
                {metrics.totalPrecip === 0 
                  ? "Arid & sunlit profile with complete dry thermal spans." 
                  : metrics.totalPrecip > 60 
                  ? "Humid & rainy climate conditions during this coordinate series."
                  : "Moderate climate with balanced humidity and thermal spans."}
              </p>
            </div>
          </div>

          {/* Draw SVG temperature details chart */}
          <div className="border border-slate-800 bg-slate-950/20 p-4 rounded-xl">
            <h4 className="font-sans font-semibold text-xs text-slate-200 mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span>Historical Temperature Profile Trend</span>
            </h4>
            {svgDimensions.width > 0 && drawHistoricalSvg()}
          </div>
        </div>
      ) : (
        <div className="bg-slate-950/30 border border-slate-850 p-8 rounded-xl text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
          <HelpCircle className="w-7 h-7 text-slate-600 animate-pulse" />
          <span>Click the query button to synchronize archival weather telemetry for this city.</span>
        </div>
      )}
    </div>
  );
}
