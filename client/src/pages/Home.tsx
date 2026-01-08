import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useUser } from "@/context/UserContext";
import { HeroSection } from "@/components/HeroSection";
import { SessionCard } from "@/components/SessionCard";
import { SessionTimeline } from "@/components/SessionTimeline";
import { SessionFilters, type ViewMode } from "@/components/SessionFilters";
import { EmptyState } from "@/components/EmptyState";
import { HeroSkeleton, SessionGridSkeleton } from "@/components/LoadingState";
import { useToast } from "@/hooks/use-toast";
import type { ForumData } from "@shared/schema";

export default function Home() {
  const { user } = useUser();
  const { toast } = useToast();
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

  // Support test mode via ?test=no-events URL parameter
  const testMode = new URLSearchParams(window.location.search).get("test");
  const apiUrl = testMode ? `/api/forum?test=${testMode}` : "/api/forum";

  const { data, isLoading, error } = useQuery<ForumData>({
    queryKey: [apiUrl],
  });

  const registerMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      return apiRequest("POST", "/api/sessions/register", { sessionId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forum"] });
      toast({
        title: "Ingeschreven",
        description: "Je bent succesvol ingeschreven voor deze sessie.",
      });
    },
    onError: () => {
      toast({
        title: "Fout",
        description: "Er is iets misgegaan bij het inschrijven.",
        variant: "destructive",
      });
    },
  });

  const unregisterMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      return apiRequest("POST", "/api/sessions/unregister", { sessionId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forum"] });
      toast({
        title: "Uitgeschreven",
        description: "Je bent uitgeschreven voor deze sessie.",
      });
    },
    onError: () => {
      toast({
        title: "Fout",
        description: "Er is iets misgegaan bij het uitschrijven.",
        variant: "destructive",
      });
    },
  });

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
      const matchesSearch =
        searchQuery === "" ||
        session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.speakerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.room.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        activeFilter === "all" || (session.categories || []).includes(activeFilter);

      return matchesSearch && matchesFilter;
    });
  }, [data?.sessions, searchQuery, activeFilter]);

  const handleRegister = (sessionId: string) => {
    if (!user?.email) return;
    registerMutation.mutate(sessionId);
  };

  const handleUnregister = (sessionId: string) => {
    if (!user?.email) return;
    unregisterMutation.mutate(sessionId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <HeroSkeleton />
        <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
          <SessionGridSkeleton />
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <EmptyState type="no-events" />
      </div>
    );
  }

  const edition = data?.edition || null;
  const sessions = data?.sessions || [];
  const hasEvent = edition && edition.id !== "no-events";
  const hasSessions = sessions.length > 0;

  return (
    <div className={`bg-background ${hasEvent && hasSessions ? "min-h-screen" : ""}`}>
      <HeroSection
        edition={edition}
        sessions={sessions}
        userEmail={user?.email}
      />

      {/* Only show sessions section when there's an actual event */}
      {hasEvent && (
        <section id="sessions" className="mx-auto max-w-7xl px-4 py-12 md:px-8">
          {sessions.length > 0 ? (
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
                      onRegister={handleRegister}
                      onUnregister={handleUnregister}
                      isPending={
                        registerMutation.isPending || unregisterMutation.isPending
                      }
                    />
                  ))}
                </div>
              ) : (
                <SessionTimeline
                  sessions={filteredSessions}
                  userEmail={user?.email}
                  onRegister={handleRegister}
                  onUnregister={handleUnregister}
                  isPending={registerMutation.isPending || unregisterMutation.isPending}
                />
              )
            ) : (
              <EmptyState type="no-results" searchQuery={searchQuery} />
            )}
          </>
        ) : (
          <EmptyState type="no-sessions" />
        )}
        </section>
      )}
    </div>
  );
}
