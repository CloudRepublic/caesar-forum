import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { ArrowLeft, Star, Send, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/context/UserContext";
import { apiRequest } from "@/lib/queryClient";
import { getInitials } from "@/lib/utils";
import type { ForumData, Session } from "@shared/schema";

function StarRating({
  value,
  onChange,
  label,
  testIdPrefix,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  testIdPrefix: string;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div>
      <Label className="mb-2 block text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="p-0.5 focus:outline-none"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            data-testid={`${testIdPrefix}-star-${star}`}
            aria-label={`${star} ster${star !== 1 ? "ren" : ""}`}
          >
            <Star
              className={`h-7 w-7 transition-colors ${
                star <= (hovered || value)
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground/40"
              }`}
            />
          </button>
        ))}
        {value > 0 && (
          <span className="ml-2 text-sm text-muted-foreground">
            {value}/5
          </span>
        )}
      </div>
    </div>
  );
}

export default function FeedbackForm() {
  const [, params] = useRoute("/edities/:date/feedback/:sessionId");
  const date = params?.date;
  const sessionId = params?.sessionId;
  const { user } = useUser();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [sessionRating, setSessionRating] = useState(0);
  const [speakerRating, setSpeakerRating] = useState(0);
  const [comments, setComments] = useState("");

  const hasValidParams = !!date && !!sessionId;

  const { data, isLoading } = useQuery<ForumData>({
    queryKey: ["/api/editions", date],
    queryFn: async () => {
      const res = await fetch(`/api/editions/${date}`);
      if (!res.ok) throw new Error("Editie niet gevonden");
      return res.json();
    },
    enabled: hasValidParams,
  });

  const session = data?.sessions.find((s: Session) => s.id === sessionId);

  useEffect(() => {
    if (session) {
      document.title = `Feedback - ${session.title}`;
    }
  }, [session]);

  const feedbackMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/feedback", {
        sessionId,
        editionDate: date,
        sessionRating,
        speakerRating,
        comments,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Feedback verstuurd",
        description: "Je feedback is per e-mail naar de spreker(s) gestuurd. Bedankt!",
      });
      setLocation(`/edities/${date}`);
    },
    onError: (error: Error) => {
      const isSessionExpired = error.message.includes("sessie is verlopen") || error.message.includes("Log opnieuw in");
      toast({
        title: isSessionExpired ? "Sessie verlopen" : "Fout bij versturen",
        description: isSessionExpired
          ? "Je sessie is verlopen. Log opnieuw in via het menu en probeer het nogmaals."
          : "Er is iets misgegaan bij het versturen van je feedback. Probeer het later opnieuw.",
        variant: "destructive",
      });
    },
  });

  const canSubmit = sessionRating > 0 && speakerRating > 0 && !feedbackMutation.isPending;

  if (!hasValidParams) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 md:px-8">
        <Link href="/eerdere-edities" className="mb-8 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Terug naar eerdere edities
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Ongeldige link.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 md:px-8">
        <Skeleton className="mb-8 h-6 w-32" />
        <Skeleton className="mb-4 h-10 w-96" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 md:px-8">
        <Link href={`/edities/${date}`} className="mb-8 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Terug naar editie
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Je moet ingelogd zijn om feedback te geven.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 md:px-8">
        <Link href={`/edities/${date}`} className="mb-8 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Terug naar editie
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <h2 className="mb-2 text-xl font-semibold">Sessie niet gevonden</h2>
            <p className="text-muted-foreground">
              Deze sessie kon niet worden gevonden.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-8">
      <Link
        href={`/edities/${date}`}
        className="mb-8 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
        data-testid="link-back-edition"
      >
        <ArrowLeft className="h-4 w-4" />
        Terug naar editie
      </Link>

      <h1 className="mb-2 text-2xl font-bold md:text-3xl" data-testid="text-feedback-title">
        Feedback geven
      </h1>
      <p className="mb-8 text-muted-foreground">
        Je feedback wordt per e-mail naar de spreker(s) gestuurd.
      </p>

      <Card className="mb-8">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0 pb-3">
          <div>
            <h2 className="text-lg font-semibold" data-testid="text-session-title">
              {session.title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatTime(session.startTime)} - {formatTime(session.endTime)} &middot; {session.room}
            </p>
          </div>
          <div className="flex flex-wrap gap-1">
            {(session.categories || []).map((cat) => (
              <Badge key={cat} variant="secondary" className="no-default-hover-elevate no-default-active-elevate">
                {cat}
              </Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {(session.descriptionHtml || session.description) && (
            session.descriptionHtml ? (
              <div
                className="text-sm text-muted-foreground [&>p]:mb-3 [&>ul]:mb-3 [&>ul]:list-disc [&>ul]:pl-6 [&>ol]:mb-3 [&>ol]:list-decimal [&>ol]:pl-6"
                data-testid="text-session-description"
                dangerouslySetInnerHTML={{ __html: session.descriptionHtml }}
              />
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-line" data-testid="text-session-description">
                {session.description}
              </p>
            )
          )}
          {session.speakers.length > 0 && (
            <div>
              <Label className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground">
                Spreker{session.speakers.length > 1 ? "s" : ""}
              </Label>
              <div className="flex flex-wrap gap-3">
                {session.speakers.map((speaker) => (
                  <div key={speaker.email} className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      {speaker.photoUrl ? (
                        <AvatarImage src={speaker.photoUrl} alt={speaker.name} />
                      ) : null}
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {getInitials(speaker.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{speaker.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-6 pt-6">
          <StarRating
            value={sessionRating}
            onChange={setSessionRating}
            label="Hoe beoordeel je de sessie-inhoud?"
            testIdPrefix="rating-session"
          />

          <StarRating
            value={speakerRating}
            onChange={setSpeakerRating}
            label="Hoe beoordeel je de spreker(s)?"
            testIdPrefix="rating-speaker"
          />

          <div>
            <Label htmlFor="comments" className="mb-2 block text-sm font-medium">
              Opmerkingen (optioneel)
            </Label>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Deel je gedachten, suggesties of complimenten..."
              maxLength={2000}
              rows={4}
              className="resize-none"
              data-testid="input-comments"
            />
            <p className="mt-1 text-xs text-muted-foreground text-right">
              {comments.length}/2000
            </p>
          </div>

          <Button
            className="w-full"
            onClick={() => feedbackMutation.mutate()}
            disabled={!canSubmit}
            data-testid="button-submit-feedback"
          >
            {feedbackMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Versturen...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Feedback versturen
              </>
            )}
          </Button>

          {!canSubmit && sessionRating === 0 && speakerRating === 0 && (
            <p className="text-center text-sm text-muted-foreground">
              Geef minimaal een beoordeling voor de sessie en de spreker(s).
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
