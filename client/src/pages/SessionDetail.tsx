import { useEffect } from "react";
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
import { isEmailInList } from "@/lib/email-utils";
import { formatDisplayName } from "@/lib/name-utils";
import { getInitials } from "@/lib/utils";
import type { Session } from "@shared/schema";

interface UserInfo {
  displayName: string;
  email: string;
}

function AttendeeItem({ email, index }: { email: string; index: number }) {
  const { data: userInfo, isLoading } = useQuery<UserInfo>({
    queryKey: ["/api/users", email],
    queryFn: async () => {
      const res = await fetch(`/api/users/${encodeURIComponent(email)}`);
      if (!res.ok) throw new Error("User not found");
      return res.json();
    },
    staleTime: 1000 * 60 * 60,
  });

  const displayName = formatDisplayName(userInfo?.displayName || email.split("@")[0]);
  const initials = displayName.split(/[\s]+/).filter(Boolean).slice(0, 2).map((w: string) => w[0]).join("").toUpperCase() || email.slice(0, 2).toUpperCase();
  const photoUrl = `/api/users/${encodeURIComponent(email)}/photo`;

  return (
    <div className="flex items-center gap-3" data-testid={`attendee-${index}`}>
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={photoUrl} alt={displayName} />
        <AvatarFallback className="bg-primary/10 text-primary text-xs">
          {initials}
        </AvatarFallback>
      </Avatar>
      {isLoading ? (
        <Skeleton className="h-4 w-32" />
      ) : (
        <span className="text-sm truncate" data-testid={`text-attendee-name-${index}`}>
          {displayName}
        </span>
      )}
    </div>
  );
}

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

export default function SessionDetail() {
  const [, params] = useRoute("/sessies/:slug");
  const slug = params?.slug;
  const { user } = useUser();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  const { toast } = useToast();

  const { data: session, isLoading, error } = useQuery<Session>({
    queryKey: ["/api/sessions/slug", slug],
    queryFn: async () => {
      const res = await fetch(`/api/sessions/slug/${slug}`);
      if (!res.ok) throw new Error("Session not found");
      return res.json();
    },
    enabled: !!slug,
  });

  useEffect(() => {
    if (session?.title) {
      document.title = `Caesar Forum - ${session.title}`;
    } else {
      document.title = "Caesar Forum - Sessie";
    }
  }, [session?.title]);

  const registerMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/sessions/register", { sessionId: session?.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/slug", slug] });
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
      await apiRequest("POST", "/api/sessions/unregister", { sessionId: session?.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/slug", slug] });
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

  const isRegistered = user?.email ? isEmailInList(user.email, session.attendees) : false;
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
        {(session.categories || []).map((category) => (
          <Badge
            key={category}
            variant="secondary"
            className={`${getCategoryColors(category)} no-default-hover-elevate no-default-active-elevate`}
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
            {session.descriptionHtml ? (
              <div 
                className="text-muted-foreground [&>p]:mb-4 [&>ul]:mb-4 [&>ul]:list-disc [&>ul]:pl-6 [&>ol]:mb-4 [&>ol]:list-decimal [&>ol]:pl-6"
                data-testid="text-session-description"
                dangerouslySetInnerHTML={{ __html: session.descriptionHtml }}
              />
            ) : (
              <div className="text-muted-foreground" data-testid="text-session-description">
                {session.description}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-6 pt-6">
              {user && session.speakers.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                    {session.speakers.length > 1 ? "Sprekers" : "Spreker"}
                  </h3>
                  <div className="space-y-3">
                    {session.speakers.map((speaker, idx) => (
                      <div key={speaker.email} className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 shrink-0">
                          {speaker.photoUrl ? (
                            <AvatarImage src={speaker.photoUrl} alt={speaker.name} />
                          ) : null}
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {getInitials(speaker.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold truncate" data-testid={`text-speaker-name-${idx}`}>
                            {speaker.name}
                          </p>
                          <p className="text-sm text-muted-foreground truncate" data-testid={`text-speaker-email-${idx}`}>
                            {speaker.email}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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

          {user && session.attendees.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="mb-4 text-sm font-medium text-muted-foreground">
                  Deelnemers ({session.attendees.length})
                </h3>
                <div className="space-y-3">
                  {session.attendees.map((email, index) => (
                    <AttendeeItem key={email} email={email} index={index} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
