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
import { Utensils } from "lucide-react";
import { isEmailInList } from "@/lib/email-utils";
import { findOverlappingSessions } from "@/lib/session-utils";
import { OverlapWarningBanner } from "@/components/OverlapWarningBanner";
import type { ForumData, Session } from "@shared/schema";

export default function Home() {
  const { user } = useUser();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
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

  const findFoodDrinkSessionBetween = (
    newSessionId: string,
    allSessions: Session[],
    userEmail: string
  ): Session | null => {
    const newSession = allSessions.find(s => s.id === newSessionId);
    if (!newSession) return null;

    const userRegisteredSessions = allSessions.filter(
      s => s.id !== newSessionId && isEmailInList(userEmail, s.attendees)
    );

    if (userRegisteredSessions.length === 0) return null;

    const newStart = new Date(newSession.startTime).getTime();
    const newEnd = new Date(newSession.endTime).getTime();

    const foodDrinkSessions = allSessions.filter(s => 
      (s.categories || []).some(c => c.toLowerCase() === "eten & drinken") &&
      !isEmailInList(userEmail, s.attendees) &&
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

  const registeredSessions = useMemo(() => {
    if (!sessions || !user?.email) return [];
    return sessions.filter((s) => isEmailInList(user.email, s.attendees));
  }, [sessions, user?.email]);

  const overlapPairs = useMemo(() => {
    return findOverlappingSessions(registeredSessions);
  }, [registeredSessions]);

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
    <div className={`bg-background ${hasEvent && hasSessions ? "min-h-screen" : ""}`}>
      <HeroSection
        edition={edition}
        sessions={sessions}
        userEmail={user?.email}
      />

      {/* Only show sessions section when there's an actual event */}
      {hasEvent && (
        <section id="sessions" className="mx-auto max-w-7xl px-4 py-12 md:px-8">
          <OverlapWarningBanner overlaps={overlapPairs} />
          
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
