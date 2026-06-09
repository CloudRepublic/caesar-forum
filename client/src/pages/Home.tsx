import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useUser } from "@/context/UserContext";
import { HeroSection } from "@/components/HeroSection";
import { SessionCard } from "@/components/SessionCard";
import { SessionTimeline } from "@/components/SessionTimeline";
import { SessionFilters, type ViewMode } from "@/components/SessionFilters";
import { EmptyState } from "@/components/EmptyState";
import { HeroSkeleton, SessionGridSkeleton, SessionTimelineSkeleton } from "@/components/LoadingState";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Utensils, ExternalLink, FileText, Clock } from "lucide-react";
import { isEmailInAttendees } from "@/lib/email-utils";
import { findOverlappingSessions } from "@/lib/session-utils";
import { OverlapWarningBanner } from "@/components/OverlapWarningBanner";
import type { ForumData, Session } from "@shared/schema";

const SESSION_SUBMIT_URL = "https://mijncaesar.welder.nl/v2/scan/263915";

function Phase1Banner({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 md:px-8 text-center" data-testid="section-phase1-banner">
      <div className="mb-6 flex justify-center">
        <div className="rounded-full bg-primary/10 p-4">
          <FileText className="h-10 w-10 text-primary" />
        </div>
      </div>
      <h2 className="mb-3 text-2xl font-bold" data-testid="text-phase1-title">
        Sessies aanmelden
      </h2>
      <p className="mb-8 text-muted-foreground leading-relaxed" data-testid="text-phase1-description">
        We hebben nog geen compleet programma — we zijn op zoek naar leuke sessies!
        Heb jij een interessant onderwerp, demo of workshop te delen met collega's?
        Meld je sessie dan aan via het formulier.
      </p>
      <Button asChild size="lg" data-testid="link-phase1-submit">
        <a href={SESSION_SUBMIT_URL} target="_blank" rel="noopener noreferrer">
          Sessie aanmelden
          <ExternalLink className="ml-2 h-4 w-4" />
        </a>
      </Button>
      {isAdmin && (
        <p className="mt-6 text-xs text-muted-foreground/60">
          Je bent admin — je ziet hieronder ook de sessies die al zijn aangemeld.
        </p>
      )}
    </div>
  );
}

function Phase2Banner() {
  return (
    <div
      className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30"
      data-testid="banner-phase2"
    >
      <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
      <p className="text-sm text-amber-800 dark:text-amber-300">
        We stellen het programma samen — inschrijven is nog niet mogelijk. Kom binnenkort terug!
      </p>
    </div>
  );
}

export default function Home() {
  const { user } = useUser();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [activeTrack, setActiveTrack] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem("forum-view-mode");
    return (saved === "grid" || saved === "timeline") ? saved : "grid";
  });
  const [foodDrinkSuggestion, setFoodDrinkSuggestion] = useState<Session | null>(null);
  const [showFoodDrinkDialog, setShowFoodDrinkDialog] = useState(false);

  useEffect(() => {
    document.title = "Caesar Forum - Dashboard";
  }, []);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem("forum-view-mode", mode);
  };

  const { data: adminCheck } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin-check"],
    queryFn: async () => {
      const res = await fetch("/api/admin-check");
      if (!res.ok) return { isAdmin: false };
      return res.json();
    },
    enabled: !!user,
  });
  const isAdmin = adminCheck?.isAdmin ?? false;

  // Support test mode via ?test=no-events URL parameter
  const testMode = new URLSearchParams(window.location.search).get("test");
  const apiUrl = testMode ? `/api/forum?test=${testMode}` : "/api/forum";

  const { data, isLoading, error, refetch } = useQuery<ForumData>({
    queryKey: [apiUrl],
  });

  const registerMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      return apiRequest("POST", "/api/sessions/register", { sessionId });
    },
    onError: (error: Error) => {
      toast({
        title: "Fout",
        description: error.message || "Er is iets misgegaan bij het inschrijven.",
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
    onError: (error: Error) => {
      toast({
        title: "Fout",
        description: error.message || "Er is iets misgegaan bij het uitschrijven.",
        variant: "destructive",
      });
    },
  });

  const availableCategories = useMemo(() => {
    if (!data?.sessions) return [];
    const categories = new Set<string>();
    data.sessions.forEach((session) => {
      (session.categories || []).forEach((cat) => {
        if (cat.toLowerCase() !== "beheer") categories.add(cat);
      });
    });
    return Array.from(categories).sort();
  }, [data?.sessions]);

  const availableTracks = useMemo(() => {
    if (!data?.sessions) return [];
    const tracks = new Set<string>();
    data.sessions.forEach((session) => {
      const sessionTracks = Array.isArray(session.track) ? session.track : [session.track ?? "Algemeen"];
      sessionTracks.forEach((t) => tracks.add(t));
    });
    return Array.from(tracks).sort();
  }, [data?.sessions]);

  useEffect(() => {
    if (activeTrack !== "all" && availableTracks.length > 0 && !availableTracks.includes(activeTrack)) {
      setActiveTrack("all");
    }
  }, [availableTracks, activeTrack]);

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

      const isAlwaysVisible = (session.categories || []).some(c =>
        c.toLowerCase() === "eten & drinken" || c.toLowerCase() === "beheer"
      );
      const sessionTracks = Array.isArray(session.track) ? session.track : [session.track ?? "Algemeen"];
      const matchesTrack =
        activeTrack === "all" || isAlwaysVisible || sessionTracks.includes(activeTrack);

      return matchesSearch && matchesFilter && matchesTrack;
    });
  }, [data?.sessions, searchQuery, activeFilter, activeTrack]);

  const findFoodDrinkSessionBetween = (
    newSessionId: string,
    allSessions: Session[],
    userEmail: string
  ): Session | null => {
    const newSession = allSessions.find(s => s.id === newSessionId);
    if (!newSession) return null;

    const userRegisteredSessions = allSessions.filter(
      s => s.id !== newSessionId && isEmailInAttendees(userEmail, s.attendees)
    );

    if (userRegisteredSessions.length === 0) return null;

    const newStart = new Date(newSession.startTime).getTime();
    const newEnd = new Date(newSession.endTime).getTime();

    const foodDrinkSessions = allSessions.filter(s => 
      (s.categories || []).some(c => c.toLowerCase() === "eten & drinken") &&
      !isEmailInAttendees(userEmail, s.attendees) &&
      s.id !== newSessionId
    );

    for (const foodSession of foodDrinkSessions) {
      const foodStart = new Date(foodSession.startTime).getTime();
      const foodEnd = new Date(foodSession.endTime).getTime();

      for (const regSession of userRegisteredSessions) {
        const regStart = new Date(regSession.startTime).getTime();
        const regEnd = new Date(regSession.endTime).getTime();

        const earlierEnd = Math.min(newEnd, regEnd);
        const laterStart = Math.max(newStart, regStart);

        if (foodStart >= earlierEnd && foodEnd <= laterStart) {
          return foodSession;
        }
        if (foodStart >= laterStart && foodEnd <= earlierEnd) {
          return null;
        }
        const gap1Start = Math.min(newEnd, regEnd);
        const gap1End = Math.max(newStart, regStart);
        
        if (gap1Start < gap1End && foodStart >= gap1Start && foodStart < gap1End) {
          return foodSession;
        }
      }
    }

    return null;
  };

  const handleRegister = (sessionId: string) => {
    if (!user?.email) return;
    
    registerMutation.mutate(sessionId, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/forum"] });
        toast({
          title: "Ingeschreven",
          description: "Je bent succesvol ingeschreven voor deze sessie.",
        });

        const foodDrink = findFoodDrinkSessionBetween(sessionId, data?.sessions || [], user.email);
        if (foodDrink) {
          setFoodDrinkSuggestion(foodDrink);
          setShowFoodDrinkDialog(true);
        }
      },
    });
  };

  const handleFoodDrinkRegister = () => {
    if (foodDrinkSuggestion) {
      registerMutation.mutate(foodDrinkSuggestion.id, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/forum"] });
          toast({
            title: "Ingeschreven",
            description: `Je bent ingeschreven voor ${foodDrinkSuggestion.title}`,
          });
        },
      });
    }
    setShowFoodDrinkDialog(false);
    setFoodDrinkSuggestion(null);
  };

  const handleUnregister = (sessionId: string) => {
    if (!user?.email) return;
    unregisterMutation.mutate(sessionId);
  };

  const edition = data?.edition || null;
  const sessions = data?.sessions || [];
  const hasEvent = edition && edition.id !== "no-events";
  const hasSessions = sessions.length > 0;
  const phase = edition?.phase ?? 1;

  const registeredSessions = useMemo(() => {
    if (!sessions || !user?.email) return [];
    return sessions.filter((s) => isEmailInAttendees(user.email, s.attendees));
  }, [sessions, user?.email]);

  const overlapPairs = useMemo(() => {
    return findOverlappingSessions(registeredSessions);
  }, [registeredSessions]);

  // For phase 2 non-admins: show grid without timeline option and no registration
  const isPhase2Visitor = phase === 2 && !isAdmin;
  // For phase 1 non-admins: hide sessions entirely
  const isPhase1Visitor = phase === 1 && !isAdmin;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <HeroSkeleton />
        <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
          {viewMode === "grid" ? <SessionGridSkeleton /> : <SessionTimelineSkeleton />}
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <EmptyState 
          type="error" 
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className={`bg-background ${hasEvent && (hasSessions || isPhase1Visitor) ? "min-h-screen" : ""}`}>
      <HeroSection
        edition={edition}
        sessions={isPhase1Visitor ? [] : sessions}
        userEmail={user?.email}
      />

      {hasEvent && (
        <section id="sessions" className="mx-auto max-w-7xl px-4 py-12 md:px-8">

          {/* Phase 1: show banner for visitors, sessions for admins */}
          {phase === 1 && (
            <>
              <Phase1Banner isAdmin={isAdmin} />
              {isAdmin && hasSessions && (
                <>
                  <div className="mt-8 mb-6 border-t pt-8">
                    <p className="mb-6 text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      Admin — Aangemelde sessies
                    </p>
                    <OverlapWarningBanner overlaps={overlapPairs} />
                    <SessionFilters
                      searchQuery={searchQuery}
                      onSearchChange={setSearchQuery}
                      activeFilter={activeFilter}
                      onFilterChange={setActiveFilter}
                      availableCategories={availableCategories}
                      activeTrack={activeTrack}
                      onTrackChange={setActiveTrack}
                      availableTracks={availableTracks}
                      viewMode={viewMode}
                      onViewModeChange={handleViewModeChange}
                    />
                  </div>
                  <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredSessions.map((session) => (
                      <SessionCard
                        key={session.id}
                        session={session}
                        userEmail={user?.email}
                        onRegister={handleRegister}
                        onUnregister={handleUnregister}
                        isPending={registerMutation.isPending || unregisterMutation.isPending}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {/* Phase 2: limited view for visitors, full view for admins */}
          {phase === 2 && (
            <>
              {isAdmin ? (
                <>
                  <OverlapWarningBanner overlaps={overlapPairs} />
                  <div className="mb-8">
                    <SessionFilters
                      searchQuery={searchQuery}
                      onSearchChange={setSearchQuery}
                      activeFilter={activeFilter}
                      onFilterChange={setActiveFilter}
                      availableCategories={availableCategories}
                      activeTrack={activeTrack}
                      onTrackChange={setActiveTrack}
                      availableTracks={availableTracks}
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
                            isPending={registerMutation.isPending || unregisterMutation.isPending}
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
                <>
                  <Phase2Banner />
                  {hasSessions ? (
                    <>
                      <div className="mb-8">
                        <SessionFilters
                          searchQuery={searchQuery}
                          onSearchChange={setSearchQuery}
                          activeFilter={activeFilter}
                          onFilterChange={setActiveFilter}
                          availableCategories={availableCategories}
                          activeTrack={activeTrack}
                          onTrackChange={setActiveTrack}
                          availableTracks={availableTracks}
                          viewMode="grid"
                          onViewModeChange={() => {}}
                          hideViewToggle
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
                              isPending={false}
                              hideTimeAndRoom
                              registrationDisabled
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
                </>
              )}
            </>
          )}

          {/* Phase 3: full view for everyone */}
          {phase === 3 && (
            <>
              <OverlapWarningBanner overlaps={overlapPairs} />
              
              {hasSessions ? (
                <>
                  <div className="mb-8">
                    <SessionFilters
                      searchQuery={searchQuery}
                      onSearchChange={setSearchQuery}
                      activeFilter={activeFilter}
                      onFilterChange={setActiveFilter}
                      availableCategories={availableCategories}
                      activeTrack={activeTrack}
                      onTrackChange={setActiveTrack}
                      availableTracks={availableTracks}
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
                            isPending={registerMutation.isPending || unregisterMutation.isPending}
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
            </>
          )}
        </section>
      )}

      <AlertDialog open={showFoodDrinkDialog} onOpenChange={setShowFoodDrinkDialog}>
        <AlertDialogContent data-testid="dialog-food-drink-suggestion">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Utensils className="h-5 w-5" />
              Eten & Drinken
            </AlertDialogTitle>
            <AlertDialogDescription>
              {foodDrinkSuggestion && (
                <>
                  Er is een <strong>{foodDrinkSuggestion.title}</strong> gepland tussen je ingeschreven sessies. 
                  Wil je je hier ook voor inschrijven?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setShowFoodDrinkDialog(false);
                setFoodDrinkSuggestion(null);
              }}
              data-testid="button-decline-food-drink"
            >
              Nee, bedankt
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleFoodDrinkRegister}
              data-testid="button-accept-food-drink"
            >
              Ja, schrijf me in
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
