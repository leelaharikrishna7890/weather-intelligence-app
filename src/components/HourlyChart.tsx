import { useState, useRef, useEffect } from "react";
import { HourlyWeatherData } from "../types";
import { Clock, Thermometer, CloudRain } from "lucide-react";

interface HourlyChartProps {
  hourly: HourlyWeatherData;
  themeColor: string;
}

export default function HourlyChart({ hourly, themeColor }: HourlyChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 200 });

  // Dynamically observe the container dimensions for perfect fluid scaling
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        // Keep standard height proportions
        setDimensions({
          width: Math.max(width, 300),
          height: 180,
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Filter today's first 24 hours
  const hoursData = hourly.time.slice(0, 24).map((timeStr, idx) => {
    const date = new Date(timeStr);
    const label = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
    return {
      index: idx,
      timeLabel: label,
      temp: hourly.temperature_2m[idx],
      prob: hourly.precipitation_probability[idx],
    };
  });

  const temps = hoursData.map((d) => d.temp);
  const probs = hoursData.map((d) => d.prob);

  const minTemp = Math.min(...temps) - 1;
  const maxTemp = Math.max(...temps) + 1;
  const tempRange = maxTemp - minTemp === 0 ? 1 : maxTemp - minTemp;

  const width = dimensions.width;
  const height = dimensions.height;
  
  const padding = { left: 40, right: 40, top: 20, bottom: 30 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Map data coordinates to SVG canvas space
  const getX = (index: number) => {
    return padding.left + (index / 23) * chartWidth;
  };

  const getYTemp = (temp: number) => {
    // Top has higher values in SVG (0 is top, height is bottom)
    const ratio = (temp - minTemp) / tempRange;
    return padding.top + chartHeight - ratio * chartHeight;
  };

  const getYProb = (prob: number) => {
    // Precipitation probability (0 to 100%) mapped to bottom half of chart
    const ratio = prob / 100;
    const probabilityHeight = chartHeight * 0.6; // limit probability heights relative to main lines
    return padding.top + chartHeight - ratio * probabilityHeight;
  };

  // Generate Temperature Spline Line Details
  let linePath = "";
  let areaPath = "";

  if (hoursData.length > 0) {
    hoursData.forEach((d, i) => {
      const x = getX(i);
      const y = getYTemp(d.temp);
      if (i === 0) {
        linePath += `M ${x} ${y}`;
        areaPath += `M ${x} ${padding.top + chartHeight} L ${x} ${y}`;
      } else {
        linePath += ` L ${x} ${y}`;
        areaPath += ` L ${x} ${y}`;
      }
    });
    areaPath += ` L ${getX(hoursData.length - 1)} ${padding.top + chartHeight} Z`;
  }

  // Find hovered object
  const hoveredData = hoveredIndex !== null ? hoursData[hoveredIndex] : null;

  return (
    <div id="hourly-chart-pane" className="relative bento-card glass-shine p-5 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-sky-400" />
          <h3 className="font-sans font-medium tracking-tight text-slate-100">
            Today's Hourly Pulse
          </h3>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-sky-450" style={{ backgroundColor: themeColor }} />
            <span>Temperature (°C)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 bg-blue-500/40 rounded" />
            <span>Precipitation Risk (%)</span>
          </div>
        </div>
      </div>

      <div ref={containerRef} className="w-full relative overflow-visible h-48 select-none">
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
          <defs>
            <linearGradient id="chartTempAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={themeColor} stopOpacity={0.18} />
              <stop offset="100%" stopColor={themeColor} stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="chartProbGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.1} />
            </linearGradient>
          </defs>

          {/* Grid lines (Horizontals) */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
            const y = padding.top + ratio * chartHeight;
            const value = maxTemp - ratio * tempRange;
            return (
              <g key={index} opacity={0.15}>
                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#cbd5e1" strokeWidth={1} strokeDasharray="3,3" />
                <text x={padding.left - 8} y={y + 4} textAnchor="end" fill="#cbd5e1" className="font-mono text-[9px] font-medium">
                  {Math.round(value)}°
                </text>
              </g>
            );
          })}

          {/* Probability Bars (Rain/Precipitation probability) */}
          {hoursData.map((d, i) => {
            if (d.prob === 0) return null;
            const x = getX(i);
            const y = getYProb(d.prob);
            const barWidth = Math.max(3, chartWidth / 36);
            return (
              <rect
                key={i}
                x={x - barWidth / 2}
                y={y}
                width={barWidth}
                height={padding.top + chartHeight - y}
                rx={1.5}
                fill="url(#chartProbGrad)"
                className="transition-all duration-300"
              />
            );
          })}

          {/* Temperature Area Fill */}
          {areaPath && (
            <path d={areaPath} fill="url(#chartTempAreaGrad)" className="transition-all duration-300" />
          )}

          {/* Temperature Line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke={themeColor}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300"
            />
          )}

          {/* Transparent interaction pillars */}
          {hoursData.map((d, i) => {
            const x = getX(i);
            return (
              <g key={i} onMouseEnter={() => setHoveredIndex(i)} onMouseLeave={() => setHoveredIndex(null)} className="cursor-crosshair">
                {/* Visual vertical pillar on hover */}
                {hoveredIndex === i && (
                  <line
                    x1={x}
                    y1={padding.top}
                    x2={x}
                    y2={padding.top + chartHeight}
                    stroke="#cbd5e1"
                    strokeWidth={1}
                    strokeOpacity={0.2}
                    strokeDasharray="2,2"
                  />
                )}
                {/* Interactive hot-spot region */}
                <rect
                  x={x - chartWidth / 46}
                  y={padding.top}
                  width={chartWidth / 23}
                  height={chartHeight}
                  fill="transparent"
                />
                
                {/* Horizontal label ticks at selective elements representing 3h intervals */}
                {i % 4 === 0 && (
                  <text
                    x={x}
                    y={height - 12}
                    textAnchor="middle"
                    fill="#94a3b8"
                    className="font-mono text-[9px]"
                  >
                    {d.timeLabel}
                  </text>
                )}
              </g>
            );
          })}

          {/* active indicator dots */}
          {hoveredIndex !== null && (
            <g>
              <circle
                cx={getX(hoveredIndex)}
                cy={getYTemp(hoursData[hoveredIndex].temp)}
                r={5.5}
                fill="#020617"
                stroke={themeColor}
                strokeWidth={2}
              />
              {hoursData[hoveredIndex].prob > 0 && (
                <circle
                  cx={getX(hoveredIndex)}
                  cy={getYProb(hoursData[hoveredIndex].prob)}
                  r={4.5}
                  fill="#020617"
                  stroke="#3b82f6"
                  strokeWidth={1.5}
                />
              )}
            </g>
          )}
        </svg>

        {/* Floating HTML tooltip for precision */}
        {hoveredData && (
          <div
            className="absolute z-10 bg-slate-950/95 border border-slate-800 backdrop-blur-md rounded-lg p-2.5 shadow-xl text-xs flex flex-col gap-1 pointer-events-none transition-all duration-100"
            style={{
              left: `${Math.min(
                Math.max(getX(hoveredIndex!) - 65, 10),
                width - 145
              )}px`,
              top: `${Math.max(getYTemp(hoveredData.temp) - 75, -10)}px`,
            }}
          >
            <div className="font-medium text-slate-300 border-b border-slate-800 pb-1 mb-1 flex items-center justify-between">
              <span>Time:</span>
              <span className="font-mono text-slate-150">{hoveredData.timeLabel}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <Thermometer className="w-3.5 h-3.5 text-orange-400" />
              <span>Temp:</span>
              <strong className="text-slate-100 font-mono">{hoveredData.temp}°C</strong>
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <CloudRain className="w-3.5 h-3.5 text-blue-400" />
              <span>Rain prob:</span>
              <strong className="text-slate-100 font-mono">{hoveredData.prob}%</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
