import React, { useState, useEffect } from "react";
import { LocationResult, WeatherData } from "../types";
import { 
  Bell, 
  Trash2, 
  Plus, 
  AlertTriangle, 
  Check, 
  Sparkles,
  Info,
  Volume2,
  VolumeX,
  Volume1
} from "lucide-react";

export interface AlertRule {
  id: string;
  cityName: string;
  cityId: number;
  metric: "temp_max" | "temp_min" | "rain_prob" | "wind_speed" | "severe";
  operator: "gt" | "lt" | "eq";
  threshold: number;
  isEnabled: boolean;
}

export interface FiredAlert {
  id: string;
  timestamp: string;
  cityName: string;
  metric: string;
  details: string;
  severity: "info" | "warning" | "danger";
}

interface AlertCenterProps {
  currentCity: LocationResult;
  weatherData: WeatherData | null;
  onDispatchToast: (message: string, type: "warning" | "success" | "info") => void;
}

export default function AlertCenter({ currentCity, weatherData, onDispatchToast }: AlertCenterProps) {
  // Config state keys
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [firedLogs, setFiredLogs] = useState<FiredAlert[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Form input builders
  const [metric, setMetric] = useState<AlertRule["metric"]>("temp_max");
  const [operator, setOperator] = useState<AlertRule["operator"]>("gt");
  const [threshold, setThreshold] = useState<number>(30);

  // 1. Synchronize persistence
  useEffect(() => {
    const rawRules = localStorage.getItem("weather_intel_alert_rules");
    if (rawRules) {
      try {
        setRules(JSON.parse(rawRules));
      } catch {
        setRules([]);
      }
    }

    const rawLogs = localStorage.getItem("weather_intel_alert_logs");
    if (rawLogs) {
      try {
        setFiredLogs(JSON.parse(rawLogs));
      } catch {
        setFiredLogs([]);
      }
    }
  }, []);

  const saveRules = (updatedRules: AlertRule[]) => {
    setRules(updatedRules);
    localStorage.setItem("weather_intel_alert_rules", JSON.stringify(updatedRules));
  };

  const saveLogs = (updatedLogs: FiredAlert[]) => {
    setFiredLogs(updatedLogs);
    localStorage.setItem("weather_intel_alert_logs", JSON.stringify(updatedLogs));
  };

  // Play subtle in-app push beep when alert is triggered
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // high pure pitch
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime); // non-destructive volume

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.15); // short chirp
    } catch (e) {
      console.warn("Audio beeper context load omitted:", e);
    }
  };

  // 2. Real-time scanning effect when new weather telemetry is pulled
  useEffect(() => {
    if (!weatherData) return;
    
    // Scan all active rules for the current city
    const activeCityRules = rules.filter(r => r.cityId === currentCity.id && r.isEnabled);
    if (activeCityRules.length === 0) return;

    const currentTemp = weatherData.current.temperature_2m;
    const currentPrecipProb = weatherData.hourly?.precipitation_probability?.[0] || 0;
    const currentWindSpeed = weatherData.current.wind_speed_10m;
    const code = weatherData.current.weather_code;

    let triggeredCount = 0;
    const newLogs: FiredAlert[] = [];

    activeCityRules.forEach(rule => {
      let isTriggered = false;
      let details = "";
      let severity: FiredAlert["severity"] = "warning";

      if (rule.metric === "temp_max" && rule.operator === "gt") {
        isTriggered = currentTemp > rule.threshold;
        details = `Current temperature is ${currentTemp.toFixed(1)}°C (Trigger: > ${rule.threshold}°C)`;
        severity = rule.threshold >= 32 ? "danger" : "warning";
      } else if (rule.metric === "temp_min" && rule.operator === "lt") {
        isTriggered = currentTemp < rule.threshold;
        details = `Current temperature is ${currentTemp.toFixed(1)}°C (Trigger: < ${rule.threshold}°C)`;
        severity = rule.threshold <= 5 ? "danger" : "info";
      } else if (rule.metric === "rain_prob" && rule.operator === "gt") {
        isTriggered = currentPrecipProb > rule.threshold;
        details = `Current rain risk sits at ${currentPrecipProb}% (Trigger: > ${rule.threshold}%)`;
        severity = rule.threshold >= 75 ? "danger" : "warning";
      } else if (rule.metric === "wind_speed" && rule.operator === "gt") {
        isTriggered = currentWindSpeed > rule.threshold;
        details = `Current atmospheric wind gusting at ${currentWindSpeed.toFixed(1)} km/h (Trigger: > ${rule.threshold} km/h)`;
        severity = rule.threshold >= 45 ? "danger" : "warning";
      } else if (rule.metric === "severe") {
        // Severe code checks: rainstorms, snowstorms, thunderstorm codes (e.g. 51-57, 61-67, 71-77, 80-86, 95-99)
        const isStorm = [56, 57, 65, 66, 67, 75, 76, 77, 82, 85, 86, 95, 96, 99].includes(code);
        isTriggered = isStorm;
        details = `Severe meteorological pattern detected (Weather code ${code}). Special advisory.`;
        severity = "danger";
      }

      if (isTriggered) {
        // Double trigger check: don't log if duplicates exist in last 2 minutes to halt spam
        const duplicateCheck = firedLogs.slice(0, 10).some(
          log => log.cityName === rule.cityName && log.metric === rule.metric && 
          (new Date().getTime() - new Date(log.timestamp).getTime() < 120000)
        );

        if (!duplicateCheck) {
          triggeredCount++;
          const alertObj: FiredAlert = {
            id: `fired-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            timestamp: new Date().toLocaleString(),
            cityName: rule.cityName,
            metric: getMetricReadable(rule.metric),
            details,
            severity,
          };
          newLogs.push(alertObj);

          // Dispatch immediate visual and beep toast alerts
          onDispatchToast(`⚠️ WEATHER ALERT: ${rule.cityName} - [${getMetricReadable(rule.metric)}] Triggered!`, severity === "danger" ? "warning" : "info");
        }
      }
    });

    if (newLogs.length > 0) {
      playBeep();
      const updatedLogs = [...newLogs, ...firedLogs].slice(0, 50); // limit logs audit size
      saveLogs(updatedLogs);
    }
  }, [weatherData, rules, currentCity]);

  // Metric helpers
  const getMetricReadable = (m: AlertRule["metric"]) => {
    switch(m) {
      case "temp_max": return "Temperature Max Over";
      case "temp_min": return "Temperature Min Under";
      case "rain_prob": return "Precipitation Probability";
      case "wind_speed": return "Wind Gust speed Limit";
      case "severe": return "Severe Storm Watch";
    }
  };

  // Add rule actions
  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Duplicate check
    const isDup = rules.some(r => r.cityId === currentCity.id && r.metric === metric && r.operator === operator && r.threshold === threshold);
    if (isDup) {
      onDispatchToast("Rule definition already exists for this city.", "info");
      return;
    }

    const newRule: AlertRule = {
      id: `rule-${Date.now()}`,
      cityName: currentCity.name,
      cityId: currentCity.id,
      metric,
      operator,
      threshold,
      isEnabled: true
    };

    saveRules([newRule, ...rules]);
    onDispatchToast(`Created real-time alert trigger for ${currentCity.name}!`, "success");
  };

  // Remove rule
  const handleRemoveRule = (id: string) => {
    const nextRules = rules.filter(r => r.id !== id);
    saveRules(nextRules);
    onDispatchToast("Deleted weather alert monitor rule.", "info");
  };

  // Toggle rule
  const handleToggleRule = (id: string) => {
    const nextRules = rules.map(r => r.id === id ? { ...r, isEnabled: !r.isEnabled } : r);
    saveRules(nextRules);
  };

  // Clear logs audit
  const handleClearLogs = () => {
    saveLogs([]);
    onDispatchToast("Cleared alert logs audit trail.", "info");
  };

  return (
    <div id="weather-alert-center" className="bento-card glass-shine p-5 md:p-6 space-y-5">
      
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-indigo-400 animate-swing" />
          <div>
            <h3 className="font-sans font-bold text-slate-100 tracking-tight text-sm md:text-base">
              Proactive Alert Center
            </h3>
            <p className="text-[10px] text-slate-500 font-mono">
              REAL-TIME PUSH WARNING TRIGGERS
            </p>
          </div>
        </div>

        {/* Beeper control toggle */}
        <button
          onClick={() => {
            setSoundEnabled(!soundEnabled);
            onDispatchToast(soundEnabled ? "Quiet mode enabled. Beeps mute." : "Audible alarm warning bleep active.", "success");
          }}
          className={`p-1.5 rounded-lg border cursor-pointer transition-colors ${
            soundEnabled 
              ? "bg-indigo-500/10 border-indigo-400/20 text-indigo-300"
              : "bg-slate-950/60 border-slate-900 text-slate-500"
          }`}
          title={soundEnabled ? "Mute alert chirp sound" : "Enable alert chirp sound"}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Creator Panel (Col span 5/12) */}
        <div className="lg:col-span-5 bg-slate-950/40 border border-slate-850 p-4 rounded-xl space-y-4">
          <div className="flex items-center gap-1.5 border-b border-slate-900 pb-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h4 className="text-[11px] font-sans font-bold text-slate-200 uppercase tracking-wide">
              Militant Monitor Setup
            </h4>
          </div>

          <form onSubmit={handleAddRule} className="space-y-3.5 text-xs text-slate-300">
            {/* Target Location indicator */}
            <div className="space-y-1 bg-slate-950/80 p-2.5 rounded-lg border border-slate-900">
              <span className="text-[9px] font-mono text-slate-500 uppercase font-bold">Target Location Grid</span>
              <p className="text-slate-250 font-sans font-semibold mt-0.5 flex items-center gap-1">
                <span>📍 {currentCity.name}</span>
                <span className="text-[10px] text-slate-500 font-mono">({currentCity.country})</span>
              </p>
            </div>

            {/* Condition Dropdown Selector */}
            <div className="space-y-1">
              <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Meteorological Metric</label>
              <select
                value={metric}
                onChange={(e) => {
                  const m = e.target.value as AlertRule["metric"];
                  setMetric(m);
                  // Setup reasonable threshold defaults depending on what metric is selected
                  if (m === "temp_max") { setOperator("gt"); setThreshold(30); }
                  else if (m === "temp_min") { setOperator("lt"); setThreshold(0); }
                  else if (m === "rain_prob") { setOperator("gt"); setThreshold(60); }
                  else if (m === "wind_speed") { setOperator("gt"); setThreshold(30); }
                  else if (m === "severe") { setOperator("eq"); setThreshold(1); }
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 uppercase font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="temp_max">Temperature Above (°C)</option>
                <option value="temp_min">Temperature Below (°C)</option>
                <option value="rain_prob">Precipitation Chance Above (%)</option>
                <option value="wind_speed">Wind Speed Exceeds (km/h)</option>
                <option value="severe">Severe Weather Advisory (Storms)</option>
              </select>
            </div>

            {/* Threshold limits settings values */}
            {metric !== "severe" && (
              <div className="space-y-1">
                <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Threshold Boundary Limit</label>
                <div className="flex gap-2">
                  <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 font-mono text-slate-400 capitalize grow-0 flex items-center shrink-0">
                    {operator === "gt" ? "Greater Than" : "Less Than"}
                  </div>
                  <input
                    type="number"
                    value={threshold}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1 text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Value (e.g. 30)"
                  />
                </div>
              </div>
            )}

            {/* Action launcher */}
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 border border-indigo-400/10 text-white font-semibold rounded-lg py-2 cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Enable Monitor Signal</span>
            </button>
          </form>
        </div>

        {/* Monitors Registry & Logs (Col span 7/12) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Active Rules register */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
              Active Sensors Status ({rules.length})
            </h4>

            {rules.length === 0 ? (
              <div className="border border-dashed border-slate-800 bg-slate-950/20 rounded-xl p-4 text-center text-[11.5px] text-slate-500">
                No active meteorological rules configured. Feed criteria using the creator grid.
              </div>
            ) : (
              <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1 font-sans">
                {rules.map((rule) => (
                  <div 
                    key={rule.id}
                    className="flex items-center justify-between bg-slate-950/50 border border-slate-900 hover:border-slate-800 p-2.5 rounded-lg text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Checkbox enabled toggle */}
                      <input 
                        type="checkbox"
                        checked={rule.isEnabled}
                        onChange={() => handleToggleRule(rule.id)}
                        className="cursor-pointer accent-indigo-500 w-3.5 h-3.5 rounded"
                      />
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-200">
                          {rule.cityName}
                        </span>
                        <span className={`text-[10.5px] font-mono mt-0.5 ${rule.isEnabled ? 'text-slate-400' : 'text-slate-600 line-through'}`}>
                          {getMetricReadable(rule.metric)} {rule.metric !== "severe" ? `${rule.operator === "gt" ? ">" : "<"} ${rule.threshold}` : ""}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveRule(rule.id)}
                      className="p-1 px-1.5 rounded bg-slate-900 border border-slate-850 hover:bg-rose-500/10 hover:border-rose-500/30 text-slate-500 hover:text-rose-450 cursor-pointer transition-all"
                      title="Decommission monitor"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fired Notifications Logs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-mono text-slate-505 uppercase tracking-wider font-bold">
                Triggered Alert Logs Audit ({firedLogs.length})
              </h4>
              
              {firedLogs.length > 0 && (
                <button
                  onClick={handleClearLogs}
                  className="text-[10px] text-slate-500 hover:text-rose-450 font-mono transition-colors"
                >
                  CLEAR TRAILS
                </button>
              )}
            </div>

            {firedLogs.length === 0 ? (
              <div className="border border-slate-850 bg-slate-950/10 rounded-xl p-5 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
                <Info className="w-4 h-4 text-slate-650 shrink-0" />
                <span>No alerts triggered for monitored locations. Scanning standard grid cycles...</span>
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 font-mono text-[10.5px]">
                {firedLogs.map((log) => (
                  <div 
                    key={log.id} 
                    className={`p-2.5 rounded-lg border flex flex-col gap-1 relative ${
                      log.severity === "danger" 
                        ? 'bg-rose-500/5 border-rose-500/15 text-rose-300' 
                        : 'bg-amber-500/5 border-amber-500/15 text-amber-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-[10px]">
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>ALERT IN {log.cityName.toUpperCase()}</span>
                      </span>
                      <span>{log.timestamp}</span>
                    </div>
                    <p className="font-sans leading-normal text-slate-205 py-0.5">
                      {log.details}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
