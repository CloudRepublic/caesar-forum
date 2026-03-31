import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, LayoutGrid, Clock } from "lucide-react";

export type ViewMode = "grid" | "timeline";

interface SessionFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  availableCategories: string[];
  activeTrack: string;
  onTrackChange: (track: string) => void;
  availableTracks: string[];
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const TRACK_DESCRIPTIONS: Record<string, string> = {
  Algemeen: "Geschikt voor iedereen.",
  Development:
    "Gericht op developers: code, technieken en infrastructuur achter development concepten.",
};

export function SessionFilters({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  availableCategories,
  activeTrack,
  onTrackChange,
  availableTracks,
  viewMode,
  onViewModeChange,
}: SessionFiltersProps) {
  const showTrackFilter = availableTracks.length > 1;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[200px] flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Zoek sessies..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
          data-testid="input-search"
        />
      </div>

      {showTrackFilter && (
        <Select value={activeTrack} onValueChange={onTrackChange}>
          <SelectTrigger className="w-auto min-w-[150px]" data-testid="select-track">
            <SelectValue>
              {activeTrack === "all" ? "Track: Alle" : `Track: ${activeTrack}`}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <span className="font-medium">Alle tracks</span>
            </SelectItem>
            {availableTracks.map((track) => (
              <SelectItem key={track} value={track}>
                <div className="flex flex-col gap-0.5 py-0.5">
                  <span className="font-medium">{track}</span>
                  {TRACK_DESCRIPTIONS[track] && (
                    <span className="text-xs text-muted-foreground max-w-[240px] whitespace-normal leading-tight">
                      {TRACK_DESCRIPTIONS[track]}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select value={activeFilter} onValueChange={onFilterChange}>
        <SelectTrigger className="w-auto min-w-[130px]" data-testid="select-type">
          <SelectValue>
            {activeFilter === "all" ? "Type: Alle" : `Type: ${activeFilter}`}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle types</SelectItem>
          {availableCategories.map((category) => (
            <SelectItem key={category} value={category} data-testid={`option-type-${category.toLowerCase()}`}>
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center rounded-md border bg-muted p-0.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewModeChange("grid")}
          className={`px-2 ${viewMode === "grid" ? "bg-background shadow-sm" : ""}`}
          data-testid="button-view-grid"
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewModeChange("timeline")}
          className={`px-2 ${viewMode === "timeline" ? "bg-background shadow-sm" : ""}`}
          data-testid="button-view-timeline"
        >
          <Clock className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
