import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, MapPin, User, Users, Check } from "lucide-react";
import type { Session, SessionType } from "@shared/schema";

interface SessionCardProps {
  session: Session;
  userEmail: string | undefined;
  onRegister: (sessionId: string) => void;
  onUnregister: (sessionId: string) => void;
  isPending?: boolean;
}

const typeLabels: Record<SessionType, string> = {
  talk: "Talk",
  workshop: "Workshop",
  discussie: "Discussie",
};

const typeColors: Record<SessionType, string> = {
  talk: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  workshop: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  discussie: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
};

export function SessionCard({
  session,
  userEmail,
  onRegister,
  onUnregister,
  isPending = false,
}: SessionCardProps) {
  const isRegistered = userEmail ? session.attendees.includes(userEmail) : false;

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

  return (
    <Card
      className="flex h-full flex-col transition-shadow duration-200 hover:shadow-md"
      data-testid={`card-session-${session.id}`}
    >
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0 pb-4">
        <Badge
          variant="secondary"
          className={`${typeColors[session.type]} no-default-hover-elevate no-default-active-elevate`}
          data-testid={`badge-type-${session.id}`}
        >
          {typeLabels[session.type]}
        </Badge>
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
        <h3
          className="text-xl font-semibold leading-tight"
          data-testid={`text-title-${session.id}`}
        >
          {session.title}
        </h3>

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

          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {getInitials(session.speakerName)}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium" data-testid={`text-speaker-${session.id}`}>
              {session.speakerName}
            </span>
          </div>
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
