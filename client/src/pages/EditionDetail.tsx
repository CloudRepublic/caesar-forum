import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Calendar, MapPin, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SessionFilters, type ViewMode } from "@/components/SessionFilters";
import { SessionCard } from "@/components/SessionCard";
import { SessionTimeline } from "@/components/SessionTimeline";
import { useUser } from "@/context/UserContext";
import type { ForumData } from "@shared/schema";

const categoryColorMap: Record<string, string> = {
  talk: "bg-[hsl(var(--category-talk-bg))] text-[hsl(var(--category-talk-fg))]",
  workshop: "bg-[hsl(var(--category-workshop-bg))] text-[hsl(var(--category-workshop-fg))]",
  demo: "bg-[hsl(var(--category-demo-bg))] text-[hsl(var(--category-demo-fg))]",
  brainstorm: "bg-[hsl(var(--category-brainstorm-bg))] text-[hsl(var(--category-brainstorm-fg))]",
  hackathon: "bg-[hsl(var(--category-hackathon-bg))] text-[hsl(var(--category-hackathon-fg))]",
  promotion: "bg-[hsl(var(--category-promotion-bg))] text-[hsl(var(--category-promotion-fg))]",
  kennissessie: "bg-[hsl(var(--category-kennissessie-bg))] text-[hsl(var(--category-kennissessie-fg))]",
  deepdive: "bg-[hsl(var(--category-deepdive-bg))] text-[hsl(var(--category-deepdive-fg))]",
};

function getCategoryColors(category: string): string {
  const key = category.toLowerCase().replace(/\s+/g, "");
  return categoryColorMap[key] || "bg-[hsl(var(--category-default-bg))] text-[hsl(var(--category-default-fg))]";
}

export default function EditionDetail() {
  const [, params] = useRoute("/edities/:date");
  const date = params?.date;
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem("forum-view-mode");
    return (saved === "grid" || saved === "timeline") ? saved : "grid";
  });

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem("forum-view-mode", mode);
  };

  const { data, isLoading, error } = useQuery<ForumData>({
    queryKey: ["/api/editions", date],
    queryFn: async () => {
      const res = await fetch(`/api/editions/${date}`);
      if (!res.ok) throw new Error("Editie niet gevonden");
      return res.json();
    },
    enabled: !!date,
  });

  useEffect(() => {
    if (data?.edition?.title) {
      document.title = `Caesar Forum - ${data.edition.title}`;
    }
  }, [data?.edition?.title]);

  const availableCategories = useMemo(() => {
    if (!data?.sessions) return [];
    const categories = new Set<string>();
    data.sessions.forEach((session) => {
      (session.categories || []).forEach((cat) => categories.add(cat));
    });
    return Array.from(categories).sort();
  }, [data?.sessions]);

  const filteredSessions = useMemo(() => {
    if (!data?.sessions) return [];
    return data.sessions.filter((session) => {
      const searchLower = searchQuery.toLowerCase();
      const speakerNames = session.speakers?.map(s => s.name.toLowerCase()).join(" ") || "";
      const matchesSearch =
        searchQuery === "" ||
        session.title.toLowerCase().includes(searchLower) ||
        session.description.toLowerCase().includes(searchLower) ||
        speakerNames.includes(searchLower) ||
        session.room.toLowerCase().includes(searchLower);
      const matchesFilter =
        activeFilter === "all" || (session.categories || []).includes(activeFilter);
      return matchesSearch && matchesFilter;
    });
  }, [data?.sessions, searchQuery, activeFilter]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("nl-NL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <Skeleton className="mb-8 h-6 w-32" />
        <Skeleton className="mb-2 h-10 w-96" />
        <Skeleton className="mb-8 h-5 w-64" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data || data.edition.id === "not-found") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
        <Link href="/eerdere-edities" className="mb-8 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Terug naar eerdere edities
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <h2 className="mb-2 text-xl font-semibold">Editie niet gevonden</h2>
            <p className="text-muted-foreground">
              Deze editie bestaat niet of kon niet worden opgehaald.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const noop = () => {};

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      <Link
        href="/eerdere-edities"
        className="mb-8 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
        data-testid="link-back-archive"
      >
        <ArrowLeft className="h-4 w-4" />
        Terug naar eerdere edities
      </Link>

      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold md:text-4xl" data-testid="text-edition-title">
          {data.edition.title}
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {formatDate(data.edition.date)}
          </span>
          {data.edition.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {data.edition.location}
            </span>
          )}
          {(data.edition.speakerCount !== undefined && data.edition.speakerCount > 0) && (
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {data.edition.speakerCount} {data.edition.speakerCount === 1 ? "spreker" : "sprekers"}, {data.edition.attendeeCount} deelnemers
            </span>
          )}
        </div>
        <Badge variant="secondary" className="mt-3 no-default-hover-elevate no-default-active-elevate">
          Afgelopen editie
        </Badge>
      </div>

      {data.sessions.length > 0 ? (
        <>
          <div className="mb-8">
            <SessionFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              availableCategories={availableCategories}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
            />
          </div>

          {filteredSessions.length > 0 ? (
            viewMode === "grid" ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    userEmail={user?.email}
                    onRegister={noop}
                    onUnregister={noop}
                    isPending={false}
                    isPastEdition
                    editionDate={date}
                  />
                ))}
              </div>
            ) : (
              <SessionTimeline
                sessions={filteredSessions}
                userEmail={user?.email}
                onRegister={noop}
                onUnregister={noop}
                isPending={false}
                isPastEdition
                editionDate={date}
              />
            )
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  Geen sessies gevonden met de huidige filters.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <h2 className="mb-2 text-xl font-semibold">Geen sessies</h2>
            <p className="text-muted-foreground">
              Er zijn geen sessies gevonden voor deze editie.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
