import { 
  Sun, 
  CloudSun, 
  Cloud, 
  CloudFog, 
  CloudDrizzle, 
  CloudRain, 
  CloudSnow, 
  CloudLightning, 
  HelpCircle,
  LucideIcon
} from "lucide-react";

export interface WeatherCondition {
  label: string;
  icon: LucideIcon;
  bgColorClass: string; // Dynamic background styling for main backdrop
  cardBgClass: string;   // Dynamic styling for inner cards
  textAccentClass: string;
  themeColor: string; // Color HEX for SVG canvas items or indicators
  accentBase: string; // Primary colored styling
}

export function getWeatherCondition(code: number, isDay: boolean = true): WeatherCondition {
  // WMO Weather interpretation codes (0-99)
  switch (code) {
    case 0: // Clear Sky
      return {
        label: "Clear Sky",
        icon: Sun,
        bgColorClass: isDay 
          ? "from-amber-500/10 via-orange-500/5 to-zinc-950" 
          : "from-blue-950/20 via-slate-900/10 to-zinc-950",
        cardBgClass: "bg-amber-500/5 border-amber-500/10 hover:border-amber-500/20",
        textAccentClass: "text-amber-400",
        themeColor: "#fbbf24",
        accentBase: "amber"
      };

    case 1:
    case 2:
    case 3: // Partly Cloudy / Cloudy
      return {
        label: code === 1 ? "Mainly Clear" : code === 2 ? "Partly Cloudy" : "Overcast",
        icon: CloudSun,
        bgColorClass: "from-sky-500/5 via-zinc-900/5 to-zinc-950",
        cardBgClass: "bg-sky-500/5 border-sky-450/10 hover:border-sky-500/20",
        textAccentClass: "text-sky-300",
        themeColor: "#7dd3fc",
        accentBase: "sky"
      };

    case 45:
    case 48: // Fog
      return {
        label: "Foggy Winds",
        icon: CloudFog,
        bgColorClass: "from-zinc-500/5 via-zinc-900/5 to-zinc-950",
        cardBgClass: "bg-zinc-500/5 border-zinc-500/15 hover:border-zinc-500/25",
        textAccentClass: "text-zinc-300",
        themeColor: "#d4d4d8",
        accentBase: "zinc"
      };

    case 51:
    case 53:
    case 55: // Drizzle
      return {
        label: "Light Drizzle",
        icon: CloudDrizzle,
        bgColorClass: "from-teal-500/5 via-zinc-900/5 to-zinc-950",
        cardBgClass: "bg-teal-550/5 border-teal-500/10 hover:border-teal-505/20",
        textAccentClass: "text-teal-300",
        themeColor: "#5eead4",
        accentBase: "teal"
      };

    case 61:
    case 63:
    case 65: // Rain
      return {
        label: code === 61 ? "Light Rain" : code === 63 ? "Moderate Rain" : "Heavy Downpour",
        icon: CloudRain,
        bgColorClass: "from-blue-500/10 via-slate-900/5 to-zinc-950",
        cardBgClass: "bg-blue-500/5 border-blue-500/10 hover:border-blue-500/20",
        textAccentClass: "text-blue-400",
        themeColor: "#60a5fa",
        accentBase: "blue"
      };

    case 56:
    case 57:
    case 66:
    case 67: // Freezing Rain/Drizzle
      return {
        label: "Freezing Rain",
        icon: CloudRain,
        bgColorClass: "from-indigo-500/10 via-zinc-900/5 to-zinc-950",
        cardBgClass: "bg-indigo-500/5 border-indigo-500/10 hover:border-indigo-500/20",
        textAccentClass: "text-indigo-400",
        themeColor: "#818cf8",
        accentBase: "indigo"
      };

    case 71:
    case 73:
    case 75:
    case 77: // Snow
      return {
        label: code === 71 ? "Light Snow" : "Blizzard Snow",
        icon: CloudSnow,
        bgColorClass: "from-cyan-500/5 via-violet-950/5 to-zinc-950",
        cardBgClass: "bg-cyan-500/5 border-cyan-505/10 hover:border-cyan-500/20",
        textAccentClass: "text-cyan-300",
        themeColor: "#67e8f9",
        accentBase: "cyan"
      };

    case 80:
    case 81:
    case 82: // Rain Showers
      return {
        label: "Local Showers",
        icon: CloudRain,
        bgColorClass: "from-cyan-600/10 via-zinc-900/5 to-zinc-950",
        cardBgClass: "bg-cyan-600/5 border-cyan-600/10 hover:border-cyan-600/20",
        textAccentClass: "text-cyan-400",
        themeColor: "#22d3ee",
        accentBase: "cyan"
      };

    case 85:
    case 86: // Snow Showers
      return {
        label: "Snow Showers",
        icon: CloudSnow,
        bgColorClass: "from-violet-500/5 via-zinc-900/5 to-zinc-950",
        cardBgClass: "bg-violet-500/5 border-violet-500/10 hover:border-violet-500/20",
        textAccentClass: "text-violet-300",
        themeColor: "#c084fc",
        accentBase: "violet"
      };

    case 95:
    case 96:
    case 99: // Thunderstorm
      return {
        label: "Severe Thunderstorm",
        icon: CloudLightning,
        bgColorClass: "from-purple-500/10 via-rose-950/5 to-zinc-950",
        cardBgClass: "bg-purple-500/5 border-purple-500/10 hover:border-purple-550/20",
        textAccentClass: "text-purple-400",
        themeColor: "#c084fc",
        accentBase: "purple"
      };

    default:
      return {
        label: "Unknown Weather",
        icon: HelpCircle,
        bgColorClass: "from-zinc-900 via-neutral-900 to-zinc-950",
        cardBgClass: "bg-zinc-800/10 border-zinc-800/20",
        textAccentClass: "text-zinc-400",
        themeColor: "#a1a1aa",
        accentBase: "zinc"
      };
  }
}
