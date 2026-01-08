import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, LayoutGrid, Clock } from "lucide-react";

export type ViewMode = "grid" | "timeline";

interface SessionFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  availableCategories: string[];
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function SessionFilters({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  availableCategories,
  viewMode,
  onViewModeChange,
}: SessionFiltersProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
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

        <div className="flex items-center gap-2">
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
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={activeFilter === "all" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onFilterChange("all")}
          data-testid="button-filter-all"
        >
          Alle
        </Button>
        {availableCategories.map((category) => (
          <Button
            key={category}
            variant={activeFilter === category ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onFilterChange(category)}
            data-testid={`button-filter-${category.toLowerCase()}`}
          >
            {category}
          </Button>
        ))}
      </div>
    </div>
  );
}
