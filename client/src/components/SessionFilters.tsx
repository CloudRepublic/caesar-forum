import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface SessionFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  availableCategories: string[];
}

export function SessionFilters({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  availableCategories,
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
