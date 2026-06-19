import { useState } from "react";
import { AIIntelligence } from "../types";
import { 
  Shirt, 
  Compass, 
  HeartPulse, 
  Car, 
  Sprout, 
  Zap, 
  Quote,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Sun,
  Wind
} from "lucide-react";

interface InsightCardsProps {
  intelligence: AIIntelligence;
  loading: boolean;
}

export default function InsightCards({ intelligence, loading }: InsightCardsProps) {
  const [expandedCard, setExpandedCard] = useState<string | null>("dressCode");

  if (loading) {
    return (
      <div id="ai-insights-loading" className="bento-card glass-shine p-6 flex flex-col items-center justify-center min-h-[300px]">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-sky-500/10" />
          <div className="absolute inset-0 rounded-full border-4 border-t-sky-400 animate-spin" />
          <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-sky-400 animate-pulse" />
        </div>
        <p className="font-sans text-sm text-slate-300 antialiased font-medium">
          Consulting Gemini AI Meteorologist...
        </p>
        <p className="font-mono text-[11px] text-slate-500 mt-1">
          Synthesizing atmospheric telemetry & life indexes
        </p>
      </div>
    );
  }

  const {
    summary,
    funQuote,
    dressCode,
    outdoorActivities,
    healthTips,
    travelSafety,
    gardeningAdvice,
    homeEnergyOptimizer,
  } = intelligence;

  // Toggle helper
  const toggleCard = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  // Bento category cards setup
  const cards = [
    {
      id: "dressCode",
      title: "Dress & Style Decider",
      subtitle: dressCode.comfortIndex,
      icon: Shirt,
      colorClass: "text-amber-400",
      bgGradient: "from-amber-550/10 via-amber-500/2 to-transparent",
      borderColor: "border-amber-500/25",
      glowColor: "shadow-[0_0_15px_rgba(245,158,11,0.05)]",
      data: (
        <div className="space-y-3">
          <p className="text-slate-300 text-sm leading-relaxed">{dressCode.recommendation}</p>
          <div className="flex flex-wrap gap-1.5 pt-2">
            {dressCode.keyItems.map((item, idx) => (
              <span key={idx} className="bg-amber-500/10 border border-amber-500/15 text-amber-300 px-2.5 py-1 text-xs rounded-full font-sans font-medium">
                {item}
              </span>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "outdoorActivities",
      title: "Outdoor & Fitness Pulse",
      subtitle: `Suitability: ${outdoorActivities.suitabilityIndex}%`,
      icon: Compass,
      colorClass: "text-emerald-400",
      bgGradient: "from-emerald-555/10 via-emerald-500/2 to-transparent",
      borderColor: "border-emerald-500/25",
      glowColor: "shadow-[0_0_15px_rgba(16,185,129,0.05)]",
      data: (
        <div className="space-y-3">
          {/* Progress bar suitability */}
          <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-400 h-full rounded-full transition-all duration-1000"
              style={{ width: `${outdoorActivities.suitabilityIndex}%` }}
            />
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">{outdoorActivities.assessment}</p>
          <div className="flex flex-wrap gap-1.5 pt-2">
            {outdoorActivities.safeActivities.map((act, idx) => (
              <span key={idx} className="bg-emerald-500/10 border border-emerald-500/15 text-emerald-300 px-2.5 py-1 text-xs rounded-full font-sans font-medium">
                {act}
              </span>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "healthTips",
      title: "Health & Wellbeing Guard",
      subtitle: "Allergy & UV Indices",
      icon: HeartPulse,
      colorClass: "text-rose-400",
      bgGradient: "from-rose-555/10 via-rose-500/2 to-transparent",
      borderColor: "border-rose-500/25",
      glowColor: "shadow-[0_0_15px_rgba(244,63,94,0.05)]",
      data: (
        <div className="space-y-3 font-sans">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
            <div className="bg-slate-950/45 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-mono tracking-wider text-rose-450 font-bold">UV Skin Threat Rating</span>
              <p className="text-xs text-slate-300 font-medium mt-0.5">{healthTips.uvRisk}</p>
            </div>
            <div className="bg-slate-950/45 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-mono tracking-wider text-sky-400 font-bold">Allergen & Pollen Count</span>
              <p className="text-xs text-slate-300 font-medium mt-0.5">{healthTips.allergyPollen}</p>
            </div>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed mt-2">{healthTips.wellnessAdvice}</p>
        </div>
      ),
    },
    {
      id: "travelSafety",
      title: "Travel & Flight Intelligence",
      subtitle: "Transit Hazard Index",
      icon: Car,
      colorClass: "text-blue-400",
      bgGradient: "from-blue-555/10 via-blue-500/2 to-transparent",
      borderColor: "border-blue-500/25",
      glowColor: "shadow-[0_0_15px_rgba(59,130,246,0.05)]",
      data: (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
            <div className="bg-slate-950/45 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-mono tracking-wider text-blue-405 font-bold">Driving Visibility</span>
              <p className="text-xs text-slate-300 font-medium mt-0.5">{travelSafety.drivingConditions}</p>
            </div>
            <div className="bg-slate-950/45 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 font-bold">Aviation Delay Hazards</span>
              <p className="text-xs text-slate-300 font-medium mt-0.5">{travelSafety.flightDelayHazard}</p>
            </div>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed mt-2">{travelSafety.generalAdvice}</p>
        </div>
      ),
    },
    {
      id: "gardeningAdvice",
      title: "Garden & Plant Steward",
      subtitle: gardeningAdvice.frostRisk ? "⚠️ Freezing Risk Detected" : "✓ Thermal Safe Range",
      icon: Sprout,
      colorClass: "text-teal-400",
      bgGradient: "from-teal-555/10 via-teal-500/2 to-transparent",
      borderColor: "border-teal-500/25",
      glowColor: "shadow-[0_0_15px_rgba(20,184,166,0.05)]",
      data: (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2 lg:mb-3">
            <span className={`w-2.5 h-2.5 rounded-full ${gardeningAdvice.frostRisk ? 'bg-rose-500 animate-ping' : 'bg-teal-500'}`} />
            <span className="text-xs text-slate-300 font-medium">
              {gardeningAdvice.frostRisk ? "Immediate protect measures required" : "No freezing frost hazard forecast"}
            </span>
          </div>
          <div className="bg-slate-950/45 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-mono tracking-wider text-teal-405 font-bold block mb-1">Watering Mandate</span>
            <p className="text-xs text-slate-300 leading-relaxed font-semibold">{gardeningAdvice.wateringNeeds}</p>
          </div>
          <div className="bg-slate-950/45 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 font-bold block mb-1">Priority Gardening Task</span>
            <p className="text-xs text-slate-300 leading-relaxed font-semibold">{gardeningAdvice.priorityTask}</p>
          </div>
        </div>
      ),
    },
    {
      id: "homeEnergyOptimizer",
      title: "Home Energy Guard & Solar",
      subtitle: `Solar Potential: ${homeEnergyOptimizer.solarEfficiencyRatio}%`,
      icon: Zap,
      colorClass: "text-purple-400",
      bgGradient: "from-purple-555/10 via-purple-500/2 to-transparent",
      borderColor: "border-purple-500/25",
      glowColor: "shadow-[0_0_15px_rgba(168,85,247,0.05)]",
      data: (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-400 font-medium font-semibold">Solar Array Potential</span>
            <span className="text-xs font-mono font-bold text-purple-400">{homeEnergyOptimizer.solarEfficiencyRatio}%</span>
          </div>
          <div className="w-full bg-slate-800/85 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-purple-500 h-full rounded-full transition-all duration-1000"
              style={{ width: `${homeEnergyOptimizer.solarEfficiencyRatio}%` }}
            />
          </div>
          <p className="text-slate-300 text-sm leading-relaxed mt-2">{homeEnergyOptimizer.hvacOptimization}</p>
          <div className="bg-slate-950/45 p-3 rounded-xl border border-slate-800 mt-1">
            <span className="text-[10px] uppercase font-mono tracking-wider text-purple-405 font-bold block mb-1">Smart Appliance Guideline</span>
            <p className="text-xs text-slate-300 leading-relaxed">{homeEnergyOptimizer.applianceTip}</p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div id="ai-insights-cabinet" className="space-y-5">
      {/* 1. General Meteorological Digest */}
      <div className="bg-gradient-to-r from-sky-400/10 via-indigo-550/5 to-slate-950 border border-slate-700/50 rounded-2xl p-5 md:p-6 shadow-xl backdrop-blur-md relative overflow-hidden bento-card glass-shine">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Sparkles className="w-40 h-40 text-sky-400 animate-pulse" />
        </div>
        <div className="flex flex-col gap-3 relative z-10">
          <div className="flex items-center gap-2">
            <span className="bg-sky-400/15 border border-sky-400/30 rounded px-2.5 py-0.5 text-[10px] text-sky-400 font-mono tracking-widest uppercase font-bold">
              Synoptic Digest
            </span>
            <span className="text-slate-500 font-mono text-[10px]">AI METEOROLOGIST CONSULTANCY</span>
          </div>
          <h3 className="font-sans font-semibold text-lg md:text-xl text-slate-100 leading-tight">
            Scientific Overview
          </h3>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed antialiased">
            {summary}
          </p>

          {/* Quotable humour highlight */}
          {funQuote && (
            <div className="border-t border-slate-800/80 pt-4 mt-2 flex gap-3 items-start">
              <Quote className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5 rotate-180" />
              <p className="text-xs md:text-sm font-sans italic text-slate-400">
                {funQuote}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 2. Interactive Bento Card Stack */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card) => {
          const IconComponent = card.icon;
          const isExpanded = expandedCard === card.id;

          return (
            <div
              key={card.id}
              className={`border rounded-2xl overflow-hidden bento-card glass-shine ${card.borderColor}`}
            >
              <button
                onClick={() => toggleCard(card.id)}
                className="w-full text-left p-5 flex items-center justify-between gap-4 outline-none select-none transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className={`p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/40 ${card.colorClass}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-sans font-medium text-sm text-slate-100">
                      {card.title}
                    </h4>
                    <span className="font-mono text-xs text-slate-400 mt-0.5 block">
                      {card.subtitle}
                    </span>
                  </div>
                </div>
                <div className="text-slate-500 hover:text-slate-300 p-1 rounded-full bg-slate-950/20">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {/* Expansion Content panel */}
              <div
                className={`transition-all duration-300 ease-in-out ${
                  isExpanded ? "max-h-[500px] border-t border-slate-800 opacity-100 pb-5 px-5 pt-3" : "max-h-0 opacity-0 pointer-events-none"
                } overflow-hidden bg-gradient-to-b ${card.bgGradient}`}
              >
                {card.data}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
