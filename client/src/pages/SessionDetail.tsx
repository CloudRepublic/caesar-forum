import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Clock, MapPin, Users, Calendar, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/context/UserContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Session } from "@shared/schema";

export default function SessionDetail() {
  const [, params] = useRoute("/sessie/:id");
  const sessionId = params?.id;
  const { user } = useUser();
  const { toast } = useToast();

  const { data: session, isLoading, error } = useQuery<Session>({
    queryKey: [`/api/sessions/${sessionId}`],
    enabled: !!sessionId,
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/sessions/register", {
        sessionId,
        userEmail: user?.email,
        userName: user?.name,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/forum"] });
      toast({
        title: "Ingeschreven",
        description: `Je bent ingeschreven voor ${session?.title}`,
      });
    },
    onError: () => {
      toast({
        title: "Fout",
        description: "Er is iets misgegaan bij het inschrijven",
        variant: "destructive",
      });
    },
  });

  const unregisterMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/sessions/unregister", {
        sessionId,
        userEmail: user?.email,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/forum"] });
      toast({
        title: "Uitgeschreven",
        description: `Je bent uitgeschreven voor ${session?.title}`,
      });
    },
    onError: () => {
      toast({
        title: "Fout",
        description: "Er is iets misgegaan bij het uitschrijven",
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("nl-NL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("nl-NL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
        <Skeleton className="mb-8 h-10 w-32" />
        <Skeleton className="mb-4 h-8 w-24" />
        <Skeleton className="mb-6 h-12 w-full" />
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Skeleton className="h-64 w-full" />
          </div>
          <div>
            <Skeleton className="h-80 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Terug naar overzicht
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <h2 className="mb-2 text-xl font-semibold">Sessie niet gevonden</h2>
            <p className="text-muted-foreground">
              Deze sessie bestaat niet of is verwijderd.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isRegistered = user?.email ? session.attendees.includes(user.email) : false;
  const isPending = registerMutation.isPending || unregisterMutation.isPending;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
        data-testid="link-back"
      >
        <ArrowLeft className="h-4 w-4" />
        Terug naar overzicht
      </Link>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        {session.categories.map((category) => (
          <Badge
            key={category}
            variant="secondary"
            className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 no-default-hover-elevate no-default-active-elevate"
            data-testid={`badge-session-category-${category.toLowerCase()}`}
          >
            {category}
          </Badge>
        ))}
        {isRegistered && (
          <Badge
            variant="default"
            className="bg-green-600 text-white dark:bg-green-700"
            data-testid="badge-registered"
          >
            <Check className="mr-1 h-3 w-3" />
            Ingeschreven
          </Badge>
        )}
      </div>

      <h1 className="mb-8 text-3xl font-bold md:text-4xl" data-testid="text-session-title">
        {session.title}
      </h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <h2 className="text-xl font-semibold">Over deze sessie</h2>
            <div className="whitespace-pre-line text-muted-foreground" data-testid="text-session-description">
              {session.description}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-6 pt-6">
              <div>
                <h3 className="mb-3 text-sm font-medium text-muted-foreground">Spreker</h3>
                <div className="flex items-center gap-3">
                  <Avatar className="h-16 w-16 shrink-0">
                    {session.speakerPhotoUrl ? (
                      <AvatarImage src={session.speakerPhotoUrl} alt={session.speakerName} />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                      {getInitials(session.speakerName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate" data-testid="text-speaker-name">
                      {session.speakerName}
                    </p>
                    <p className="text-sm text-muted-foreground truncate" data-testid="text-speaker-email">
                      {session.speakerEmail}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span data-testid="text-session-date">{formatDate(session.startTime)}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span data-testid="text-session-time">
                    {formatTime(session.startTime)} - {formatTime(session.endTime)}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span data-testid="text-session-room">{session.room}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span data-testid="text-session-attendees">
                    {session.attendees.length} deelnemer{session.attendees.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4">
                {user?.email ? (
                  isRegistered ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => unregisterMutation.mutate()}
                      disabled={isPending}
                      data-testid="button-unregister"
                    >
                      Uitschrijven
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => registerMutation.mutate()}
                      disabled={isPending}
                      data-testid="button-register"
                    >
                      Inschrijven
                    </Button>
                  )
                ) : (
                  <Button variant="secondary" className="w-full" disabled>
                    Log in om in te schrijven
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
