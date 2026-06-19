import { Star, MapPin, X, Plus } from "lucide-react";
import { LocationResult } from "../types";

interface FavoritesListProps {
  favorites: LocationResult[];
  onSelect: (loc: LocationResult) => void;
  onRemove: (id: number) => void;
  onAddCurrent: () => void;
  currentCity: LocationResult | null;
}

export default function FavoritesList({
  favorites,
  onSelect,
  onRemove,
  onAddCurrent,
  currentCity,
}: FavoritesListProps) {
  const isCurrentFavorited = currentCity 
    ? favorites.some((fav) => fav.id === currentCity.id) 
    : false;

  return (
    <div id="favorites-section" className="bento-card glass-shine p-5 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
          <h3 className="font-sans font-medium tracking-tight text-slate-100">
            Saved Locations
          </h3>
        </div>

        {currentCity && !isCurrentFavorited && (
          <button
            onClick={onAddCurrent}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/25 text-emerald-300 text-xs font-medium cursor-pointer transition-all duration-200"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Save {currentCity.name}</span>
          </button>
        )}
      </div>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/10">
          <MapPin className="w-8 h-8 text-slate-500 mb-2 stroke-[1.5]" />
          <span className="text-xs text-slate-350 font-medium font-sans">No saved locations yet</span>
          <p className="text-[10px] text-slate-500 mt-1 font-sans">
            Search for a city and save it here for instant lookup dashboards.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {favorites.map((fav) => {
            const isActive = currentCity?.id === fav.id;

            return (
              <div
                key={fav.id}
                className={`group flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300 relative overflow-hidden ${
                  isActive
                    ? "bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.05)]"
                    : "bg-slate-950/40 border-slate-800 hover:border-slate-700"
                }`}
              >
                {/* Clickable Card Body */}
                <button
                  onClick={() => onSelect(fav)}
                  className="flex-1 text-left flex flex-col gap-0.5 outline-none cursor-pointer"
                >
                  <span className={`text-xs font-semibold ${isActive ? "text-indigo-300 font-sans" : "text-slate-200"}`}>
                    {fav.name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 pr-5 truncate">
                    {fav.admin1 ? `${fav.admin1}, ` : ""}{fav.country}
                  </span>
                </button>

                {/* Remove from favorites */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(fav.id);
                  }}
                  className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-slate-950/60 transition-all cursor-pointer opacity-80 group-hover:opacity-100"
                  title="Remove Bookmark"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
