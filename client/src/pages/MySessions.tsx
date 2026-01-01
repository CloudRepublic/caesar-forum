import { useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useUser } from "@/context/UserContext";
import { SessionCard } from "@/components/SessionCard";
import { EmptyState } from "@/components/EmptyState";
import { SessionGridSkeleton } from "@/components/LoadingState";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar } from "lucide-react";
import type { ForumData } from "@shared/schema";

export default function MySessions() {
  const { user } = useUser();
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery<ForumData>({
    queryKey: ["/api/forum"],
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

  const mySessions = useMemo(() => {
    if (!data?.sessions || !user?.email) return [];

    return data.sessions
      .filter((session) => session.attendees.includes(user.email))
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [data?.sessions, user?.email]);

  const handleUnregister = (sessionId: string) => {
    if (!user?.email) return;
    unregisterMutation.mutate(sessionId);
  };

  const formatEditionDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("nl-NL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back-dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Terug naar Dashboard
            </Button>
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold" data-testid="text-page-title">
                Mijn Sessies
              </h1>
              {data?.edition && (
                <p className="mt-1 text-muted-foreground">
                  {data.edition.title} - {formatEditionDate(data.edition.date)}
                </p>
              )}
            </div>

            {mySessions.length > 0 && (
              <div className="flex items-center gap-2 rounded-md bg-muted px-4 py-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium" data-testid="text-session-count">
                  {mySessions.length} sessie{mySessions.length !== 1 ? "s" : ""} gepland
                </span>
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <SessionGridSkeleton />
        ) : error ? (
          <EmptyState type="no-events" />
        ) : mySessions.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mySessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                userEmail={user?.email}
                onRegister={() => {}}
                onUnregister={handleUnregister}
                isPending={unregisterMutation.isPending}
              />
            ))}
          </div>
        ) : (
          <div className="py-8">
            <EmptyState type="no-registrations" />
            <div className="mt-6 flex justify-center">
              <Link href="/">
                <Button data-testid="button-go-to-dashboard">
                  Bekijk alle sessies
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
