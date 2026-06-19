import { useState, useEffect, useRef } from "react";
import { 
  CloudSun, 
  MapPin, 
  Star, 
  Search, 
  Loader2, 
  TrendingUp, 
  Layout, 
  Sparkles,
  RefreshCw,
  AlertOctagon,
  X,
  History
} from "lucide-react";
import { AIIntelligence, LocationResult, WeatherData } from "./types";
import Dashboard from "./components/Dashboard";
import ForecastCard from "./components/ForecastCard";
import HourlyChart from "./components/HourlyChart";
import FavoritesList from "./components/FavoritesList";
import InsightCards from "./components/InsightCards";
import { getWeatherCondition } from "./utils/weatherUtils";
import ForecastAndTrendsChart from "./components/ForecastAndTrendsChart";
import HistoricalPanel from "./components/HistoricalPanel";
import AlertCenter from "./components/AlertCenter";

// Default seed location (London, UK)
const DEFAULT_CITY: LocationResult = {
  id: 2643743,
  name: "London",
  latitude: 51.50853,
  longitude: -0.12574,
  country: "United Kingdom",
  country_code: "GB",
  admin1: "England",
  timezone: "Europe/London",
};

export default function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [selectedCity, setSelectedCity] = useState<LocationResult>(DEFAULT_CITY);
  
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [intelligence, setIntelligence] = useState<AIIntelligence | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  // Toast notifications trigger state
  interface ToastAlert {
    id: string;
    message: string;
    type: "warning" | "success" | "info";
  }
  const [toasts, setToasts] = useState<ToastAlert[]>([]);

  const dispatchToast = (message: string, type: "warning" | "success" | "info" = "info") => {
    const newToast: ToastAlert = {
      id: `toast-${Date.now()}-${Math.random()}`,
      message,
      type
    };
    setToasts((prev) => [...prev, newToast]);

    // Cleanup toast banner automatically after 4.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 4500);
  };

  // Lists persistence
  const [favorites, setFavorites] = useState<LocationResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<LocationResult[]>([]);

  // State handlers
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [loadingIntelligence, setLoadingIntelligence] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // 1. Initial configuration mounts
  useEffect(() => {
    // Read local storage settings
    const storedFavs = localStorage.getItem("weather_fav_locations_intel");
    if (storedFavs) {
      try {
        setFavorites(JSON.parse(storedFavs));
      } catch {
        setFavorites([]);
      }
    }

    const storedRecents = localStorage.getItem("weather_recent_locations_intel");
    if (storedRecents) {
      try {
        setRecentSearches(JSON.parse(storedRecents));
      } catch {
        setRecentSearches([]);
      }
    }

    // Load initial default weather
    fetchWeatherDetails(DEFAULT_CITY);
  }, []);

  // 2. Click outside geocoding list dismiss handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchResults([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 3. Geocoding live search queries
  useEffect(() => {
    if (searchQuery.trim().length <= 1) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const response = await fetch(`/api/weather/search?q=${encodeURIComponent(searchQuery)}`);
        if (!response.ok) throw new Error("Search suggestions payload corrupt");
        const data = await response.json();
        
        if (data.results && Array.isArray(data.results)) {
          setSearchResults(data.results);
        } else {
          setSearchResults([]);
        }
      } catch (err: any) {
        console.error("Geocoding lookup failed:", err.message);
      } finally {
        setSearchLoading(false);
      }
    }, 450); // debounce keys input

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 4. Primary fetch coordinates weather payload orchestrator
  const fetchWeatherDetails = async (city: LocationResult) => {
    setLoadingWeather(true);
    setLoadingIntelligence(true);
    setError(null);
    setSelectedCity(city);
    // Reset selected day to today on city change
    setSelectedDayIndex(0);

    // Save of city in Recents
    updateRecentSearches(city);

    try {
      // Stream parameters
      const url = `/api/weather/forecast?lat=${city.latitude}&lon=${city.longitude}&timezone=${encodeURIComponent(city.timezone)}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to load weather report (Status: ${res.status})`);
      }
      
      const payload: WeatherData = await res.json();
      setWeatherData(payload);

      // Once weather resolves, trigger AI intelligence analysis in background/sequential flow
      await fetchAIWeatherIntelligence(payload, city);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected network error occurred while updating the forecast.");
      setLoadingIntelligence(false);
    } finally {
      setLoadingWeather(false);
    }
  };

  // 5. Fire Gemini Secure AI Analysis
  const fetchAIWeatherIntelligence = async (weather: WeatherData, city: LocationResult) => {
    try {
      const response = await fetch("/api/weather/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current: weather.current,
          daily: weather.daily,
          city: city.name,
          country: city.country,
        }),
      });

      if (!response.ok) {
        throw new Error(`Intelligence service failed (Status: ${response.status})`);
      }

      const advice: AIIntelligence = await response.json();
      if (advice && advice.summary) {
        setIntelligence(advice);
      } else {
        throw new Error("Invalid intelligence response envelope");
      }
    } catch (err: any) {
      console.error("AI Insights Error:", err.message);
      setError("Weather insights are temporarily unavailable. Retrying in background...");
    } finally {
      setLoadingIntelligence(false);
    }
  };

  // 6. Recents tracker helper
  const updateRecentSearches = (city: LocationResult) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.id !== city.id);
      const updated = [city, ...filtered].slice(0, 5); // limit to 5
      localStorage.setItem("weather_recent_locations_intel", JSON.stringify(updated));
      return updated;
    });
  };

  // 7. Saved favorites triggers
  const handleAddCurrentToFavorites = () => {
    if (!selectedCity) return;
    setFavorites((prev) => {
      if (prev.some((f) => f.id === selectedCity.id)) return prev;
      const updated = [...prev, selectedCity];
      localStorage.setItem("weather_fav_locations_intel", JSON.stringify(updated));
      return updated;
    });
  };

  const handleRemoveFromFavorites = (id: number) => {
    setFavorites((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      localStorage.setItem("weather_fav_locations_intel", JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearRecents = () => {
    setRecentSearches([]);
    localStorage.removeItem("weather_recent_locations_intel");
  };

  const activeCondition = weatherData 
    ? getWeatherCondition(weatherData.current.weather_code, weatherData.current.is_day === 1) 
    : getWeatherCondition(0, true);

  return (
    <div className="min-h-screen bg-[#020617] font-sans tracking-tight text-slate-200 flex flex-col relative overflow-hidden">
      
      {/* Real-time Toast Alerts overlay */}
      <div className="fixed top-6 right-6 z-50 space-y-2 pointer-events-none max-w-sm w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto p-4 rounded-xl border shadow-2xl backdrop-blur-md flex items-start gap-3 transition-all duration-300 ${
              t.type === "warning"
                ? "bg-rose-950/90 border-rose-500/30 text-rose-205"
                : t.type === "success"
                ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-200"
                : "bg-slate-900/95 border-slate-850 text-slate-200"
            }`}
          >
            <div className="grow text-xs leading-relaxed font-sans font-medium">
              {t.message}
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
              className="p-1 rounded hover:bg-slate-800 text-slate-450 hover:text-slate-200 cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Decorative Blur Backdrops for subtle modern atmosphere */}
      <div 
        className="absolute top-[-250px] left-[-300px] w-[600px] h-[600px] rounded-full blur-[160px] opacity-10 pointer-events-none transition-all duration-700" 
        style={{ backgroundColor: activeCondition.themeColor }}
      />
      
      {/* Top Header Row Panel */}
      <header id="main-header" className="sticky top-0 z-40 border-b border-slate-800/85 bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <CloudSun className="w-6 h-6 text-white stroke-[2]" />
            </div>
            <div>
              <h1 className="font-sans font-bold text-lg md:text-xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                WeatherIntel <span className="text-blue-550 text-gradient">AI</span>
              </h1>
              <span className="font-mono text-[9px] text-slate-500 tracking-wider block font-bold">
                GEMINI 3.5 DECISION ENGINE
              </span>
            </div>
          </div>

          {/* Quick Refresh metrics button */}
          <div className="flex items-center gap-3">
            {selectedCity && (
              <button
                onClick={() => fetchWeatherDetails(selectedCity)}
                disabled={loadingWeather}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/50 hover:bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400 hover:text-slate-250 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingWeather ? "animate-spin" : ""}`} />
                <span>SYNC TELEMETRY</span>
              </button>
            )}
          </div>

        </div>
      </header>

      {/* Main Structural Body View Split */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* Left Column Controllers panel (Search + Saved + Recents) */}
        <section id="sidebar-controls" className="lg:col-span-4 space-y-5">
          
          {/* Glass Search bar & Suggested Dropdown */}
          <div className="bento-card glass-shine p-5 relative">
            <label className="text-xs font-mono uppercase text-slate-500 tracking-wider block mb-2 font-bold">
              Explore Global Grid
            </label>
            <div ref={searchContainerRef} className="relative">
              <div className="relative flex items-center">
                <Search className="absolute left-3.5 w-4.5 h-4.5 text-slate-500 shrink-0" />
                <input
                  type="text"
                  placeholder="Query city (e.g., Tokyo, Paris, Nairobi)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/10 placeholder-slate-500 transition-all text-slate-200"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 p-0.5 rounded-full hover:bg-slate-800 text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Suggestions Overlay Dropdown */}
              {(searchResults.length > 0 || searchLoading) && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-slate-950 border border-slate-850 rounded-xl shadow-2xl overflow-hidden backdrop-blur-md max-h-60 overflow-y-auto">
                  {searchLoading ? (
                    <div className="p-4 flex items-center justify-center gap-2 text-xs text-slate-400 font-mono">
                      <Loader2 className="w-4 h-4 animate-spin text-sky-450" />
                      <span>Resolving geocodes...</span>
                    </div>
                  ) : (
                    searchResults.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => {
                          fetchWeatherDetails(result);
                          setSearchQuery("");
                          setSearchResults([]);
                        }}
                        className="w-full text-left p-3 hover:bg-slate-900 border-b border-slate-900/40 font-sans transition-colors flex flex-col gap-0.5 outline-none cursor-pointer"
                      >
                        <span className="text-sm font-semibold text-slate-200">
                          {result.name}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          {result.admin1 ? `${result.admin1}, ` : ""}{result.country}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bookmarks saved location element */}
          <FavoritesList 
            favorites={favorites}
            onSelect={fetchWeatherDetails}
            onRemove={handleRemoveFromFavorites}
            onAddCurrent={handleAddCurrentToFavorites}
            currentCity={selectedCity}
          />

          {/* History Recents lookup block */}
          {recentSearches.length > 0 && (
            <div className="bento-card glass-shine p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-slate-300">
                  <History className="w-4 h-4 text-slate-500" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider font-mono text-slate-400">Recent Searches</h4>
                </div>
                <button
                  onClick={handleClearRecents}
                  className="text-[10px] text-slate-500 hover:text-rose-400 font-mono flex items-center gap-1 cursor-pointer transition-colors"
                >
                  CLEAR
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recentSearches.map((rec) => (
                  <button
                    key={`recent-${rec.id}`}
                    onClick={() => fetchWeatherDetails(rec)}
                    className="p-1 px-2.5 rounded-lg bg-slate-950/40 hover:bg-slate-900 border border-slate-800 text-xs font-sans text-slate-400 hover:text-slate-200 cursor-pointer transition-all"
                  >
                    {rec.name}
                  </button>
                ))}
              </div>
            </div>
          )}

        </section>

        {/* Right Column Core Meteorological Dashboard Presentation */}
        <section id="climate-dash" className="lg:col-span-8 space-y-6">
          
          {/* Global network error report block */}
          {error && (
            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-start gap-3 text-sm text-amber-300 animate-pulse">
              <AlertOctagon className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold font-sans">Notification:</p>
                <p className="text-xs text-amber-400/90 leading-relaxed font-sans">{error}</p>
              </div>
            </div>
          )}

          {loadingWeather ? (
            <div className="bento-card glass-shine p-12 flex flex-col items-center justify-center min-h-[400px]">
              <Loader2 className="w-10 h-10 animate-spin text-sky-450 mb-4" />
              <p className="text-slate-300 font-sans font-medium">Downloading weather telemetry...</p>
              <p className="text-slate-500 font-mono text-xs mt-1">Connecting to Open-Meteo satellite grid</p>
            </div>
          ) : weatherData && selectedCity ? (
            <div className="space-y-6">
              {/* Current Weather Overview Panel */}
              <Dashboard 
                current={weatherData.current} 
                daily={weatherData.daily} 
                city={selectedCity}
                selectedDayIndex={selectedDayIndex}
              />

              {/* Today's Hourly Graph element */}
              <HourlyChart 
                hourly={weatherData.hourly} 
                themeColor={activeCondition.themeColor} 
              />

              {/* 7-day weather outlook grid list */}
              <ForecastCard 
                daily={weatherData.daily} 
                selectedDayIndex={selectedDayIndex} 
                onSelectDay={setSelectedDayIndex}
              />

              {/* Multi-Metric Forecast Trend Graphics */}
              <ForecastAndTrendsChart daily={weatherData.daily} />

              {/* Weather Warning & Proactive Alert Trigger Subsystems */}
              <AlertCenter 
                currentCity={selectedCity} 
                weatherData={weatherData} 
                onDispatchToast={dispatchToast}
              />

              {/* Archival Historiographic Climate Database Analysis */}
              <HistoricalPanel city={selectedCity} />

              {/* Gemini Secure AI Decision Grid wrapper */}
              <div id="decision-insights-portal" className="pt-2">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                  <h3 className="font-sans font-bold text-slate-100 tracking-tight">
                    AI Decision Intelligence
                  </h3>
                </div>
                {intelligence ? (
                  <InsightCards 
                    intelligence={intelligence} 
                    loading={loadingIntelligence} 
                  />
                ) : (
                  <div className="bento-card glass-shine p-6 flex flex-col items-center justify-center min-h-[150px]">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-400 mb-2" />
                    <p className="text-slate-450 text-xs font-sans">Connecting to secure intelligence network...</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bento-card glass-shine p-12 flex flex-col items-center justify-center min-h-[400px] text-center">
              <CloudSun className="w-16 h-16 text-slate-600 mb-3 animate-pulse" />
              <h3 className="text-slate-305 font-sans font-semibold text-base">Select Location Grid</h3>
              <p className="text-slate-500 text-xs mt-1 max-w-sm font-sans leading-relaxed">
                Enter a city in the explore field or pick from your saved locations to begin synoptic diagnostics.
              </p>
            </div>
          )}

        </section>

      </main>

      {/* Decorative Footer */}
      <footer className="border-t border-slate-900/60 bg-slate-950/80 py-6 px-4 text-center mt-auto font-mono text-[10px] text-slate-605">
        <p>© 2026 WEATHER INTELLIGENCE HUB • DEPLOYED COMPLIANT • OPEN-METEO DATA RETRIEVAL</p>
      </footer>

    </div>
  );
}
