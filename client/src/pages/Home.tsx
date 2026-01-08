import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useUser } from "@/context/UserContext";
import { HeroSection } from "@/components/HeroSection";
import { SessionCard } from "@/components/SessionCard";
import { SessionFilters } from "@/components/SessionFilters";
import { EmptyState } from "@/components/EmptyState";
import { HeroSkeleton, SessionGridSkeleton } from "@/components/LoadingState";
import { useToast } from "@/hooks/use-toast";
import type { ForumData, Session, SessionType } from "@shared/schema";

export default function Home() {
  const { user } = useUser();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<SessionType | "all">("all");

  const { data, isLoading, error } = useQuery<ForumData>({
    queryKey: ["/api/forum"],
  });

  const registerMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      return apiRequest("POST", "/api/sessions/register", {
        sessionId,
        userEmail: user?.email,
        userName: user?.name,
      });
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
      return apiRequest("POST", "/api/sessions/unregister", {
        sessionId,
        userEmail: user?.email,
      });
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
        activeFilter === "all" || session.type === activeFilter;

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

  return (
    <div className="min-h-screen bg-background">
      <HeroSection
        edition={edition}
        sessions={sessions}
        userEmail={user?.email}
      />

      <section id="sessions" className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        {sessions.length > 0 ? (
          <>
            <div className="mb-8">
              <SessionFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
              />
            </div>

            {filteredSessions.length > 0 ? (
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
              <EmptyState type="no-results" searchQuery={searchQuery} />
            )}
          </>
        ) : (
          <EmptyState type="no-sessions" />
        )}
      </section>
    </div>
  );
}
