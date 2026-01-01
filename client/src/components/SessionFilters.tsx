import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import type { SessionType } from "@shared/schema";

interface SessionFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilter: SessionType | "all";
  onFilterChange: (filter: SessionType | "all") => void;
}

const filters: { value: SessionType | "all"; label: string }[] = [
  { value: "all", label: "Alle" },
  { value: "talk", label: "Talks" },
  { value: "workshop", label: "Workshops" },
  { value: "discussie", label: "Discussies" },
];

export function SessionFilters({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
}: SessionFiltersProps) {
  return (
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

      <div className="flex flex-wrap items-center gap-2">
        {filters.map((filter) => (
          <Button
            key={filter.value}
            variant={activeFilter === filter.value ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onFilterChange(filter.value)}
            data-testid={`button-filter-${filter.value}`}
          >
            {filter.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
