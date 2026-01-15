import { Link } from "wouter";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, MapPin, Users, Check, Utensils } from "lucide-react";
import { isEmailInList } from "@/lib/email-utils";
import { getInitials } from "@/lib/utils";
import type { Session } from "@shared/schema";

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

function isFoodDrinkSession(categories: string[]): boolean {
  return categories.some(c => c.toLowerCase() === "eten & drinken");
}

function getCategoryColors(category: string): string {
  const key = category.toLowerCase().replace(/\s+/g, "");
  return categoryColorMap[key] || "bg-[hsl(var(--category-default-bg))] text-[hsl(var(--category-default-fg))]";
}

interface SessionCardProps {
  session: Session;
  userEmail: string | undefined;
  onRegister: (sessionId: string) => void;
  onUnregister: (sessionId: string) => void;
  isPending?: boolean;
}

export function SessionCard({
  session,
  userEmail,
  onRegister,
  onUnregister,
  isPending = false,
}: SessionCardProps) {
  const isRegistered = userEmail ? isEmailInList(userEmail, session.attendees) : false;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("nl-NL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isFoodDrink = isFoodDrinkSession(session.categories || []);

  return (
    <Card
      className={`flex h-full flex-col transition-shadow duration-200 hover:shadow-md ${
        isFoodDrink ? "relative overflow-hidden" : ""
      }`}
      data-testid={`card-session-${session.id}`}
    >
      {isFoodDrink && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 bottom-0 w-32 h-32 opacity-[0.06] dark:opacity-[0.08]">
            <Utensils className="w-full h-full text-foreground" />
          </div>
        </div>
      )}
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0 pb-4">
        <div className="flex flex-wrap gap-1">
          {(session.categories || []).map((category) => (
            <Badge
              key={category}
              variant="secondary"
              className={`${getCategoryColors(category)} no-default-hover-elevate no-default-active-elevate`}
              data-testid={`badge-category-${session.id}-${category.toLowerCase()}`}
            >
              {category.toLowerCase() === "eten & drinken" && (
                <Utensils className="mr-1 h-3 w-3" />
              )}
              {category}
            </Badge>
          ))}
        </div>
        {isRegistered && (
          <Badge
            variant="default"
            className="bg-green-600 text-white dark:bg-green-700"
            data-testid={`badge-registered-${session.id}`}
          >
            <Check className="mr-1 h-3 w-3" />
            Ingeschreven
          </Badge>
        )}
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        <Link href={`/sessies/${session.slug}`}>
          <h3
            className="text-xl font-semibold leading-tight hover:text-primary cursor-pointer transition-colors"
            data-testid={`text-title-${session.id}`}
          >
            {session.title}
          </h3>
        </Link>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 shrink-0" />
            <span data-testid={`text-time-${session.id}`}>
              {formatTime(session.startTime)} - {formatTime(session.endTime)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span data-testid={`text-room-${session.id}`}>{session.room}</span>
          </div>

          {userEmail && session.speakers.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {session.speakers.slice(0, 3).map((speaker) => (
                  <Avatar key={speaker.email} className="h-6 w-6 border-2 border-background">
                    {speaker.photoUrl ? (
                      <AvatarImage src={speaker.photoUrl} alt={speaker.name} />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {getInitials(speaker.name)}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <span className="font-medium" data-testid={`text-speaker-${session.id}`}>
                {session.speakers.map(s => s.name).join(" & ")}
              </span>
            </div>
          )}
        </div>

        <p
          className="line-clamp-2 text-sm text-muted-foreground"
          data-testid={`text-description-${session.id}`}
        >
          {session.description}
        </p>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span data-testid={`text-attendees-${session.id}`}>
            {session.attendees.length} deelnemer{session.attendees.length !== 1 ? "s" : ""}
          </span>
        </div>
      </CardContent>

      <CardFooter className="pt-4">
        {userEmail ? (
          isRegistered ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onUnregister(session.id)}
              disabled={isPending}
              data-testid={`button-unregister-${session.id}`}
            >
              Uitschrijven
            </Button>
          ) : (
            <Button
              className="w-full"
              onClick={() => onRegister(session.id)}
              disabled={isPending}
              data-testid={`button-register-${session.id}`}
            >
              Inschrijven
            </Button>
          )
        ) : (
          <Button variant="secondary" className="w-full" disabled>
            Log in om in te schrijven
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
