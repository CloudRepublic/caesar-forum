import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, MapPin, Users, Check, Utensils } from "lucide-react";
import { isEmailInList, isSpeaker } from "@/lib/email-utils";
import { getInitials } from "@/lib/utils";
import type { Session } from "@shared/schema";
import foodDrinkBg from "@assets/image_1768474260490.png";

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

interface SessionTimelineProps {
  sessions: Session[];
  userEmail: string | undefined;
  onRegister: (sessionId: string) => void;
  onUnregister: (sessionId: string) => void;
  isPending?: boolean;
}

export function SessionTimeline({
  sessions,
  userEmail,
  onRegister,
  onUnregister,
  isPending = false,
}: SessionTimelineProps) {
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("nl-NL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  const timeSlots = sortedSessions.reduce((acc, session) => {
    const time = formatTime(session.startTime);
    if (!acc[time]) {
      acc[time] = [];
    }
    acc[time].push(session);
    return acc;
  }, {} as Record<string, Session[]>);

  return (
    <div className="relative" data-testid="session-timeline">
      <div className="absolute left-[60px] top-0 bottom-0 w-0.5 bg-border md:left-[80px]" />

      {Object.entries(timeSlots).map(([time, slotSessions]) => (
        <div key={time} className="relative mb-8 last:mb-0">
          <div className="flex items-start gap-4 md:gap-6">
            <div className="relative z-10 flex w-[50px] shrink-0 flex-col items-center md:w-[70px]">
              <div className="rounded-md bg-primary px-2 py-1 text-sm font-semibold text-primary-foreground md:px-3">
                {time}
              </div>
              <div className="mt-2 h-3 w-3 rounded-full bg-primary" />
            </div>

            <div className="flex-1 pt-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {slotSessions.map((session) => {
                const isRegistered = userEmail
                  ? isEmailInList(userEmail, session.attendees)
                  : false;
                const isUserSpeaker = userEmail
                  ? isSpeaker(userEmail, session.speakers)
                  : false;

                const isFoodDrink = isFoodDrinkSession(session.categories || []);

                return (
                  <div
                    key={session.id}
                    className={`relative rounded-lg border p-4 transition-all ${
                      isRegistered || isUserSpeaker
                        ? "border-green-500/50 bg-green-50/50 dark:border-green-500/30 dark:bg-green-950/20"
                        : "border-border bg-card"
                    }`}
                    data-testid={`timeline-session-${session.id}`}
                  >
                    {isFoodDrink && (
                      <div 
                        className="absolute inset-0 opacity-[0.12] dark:opacity-[0.10] pointer-events-none rounded-lg overflow-hidden"
                      >
                        <div 
                          className="absolute inset-0"
                          style={{
                            backgroundImage: `url(${foodDrinkBg})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }}
                        />
                      </div>
                    )}

                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {(session.categories || []).map((category) => (
                            <Badge
                              key={category}
                              variant="secondary"
                              className={`${getCategoryColors(category)} no-default-hover-elevate no-default-active-elevate text-xs`}
                            >
                              {category.toLowerCase() === "eten & drinken" && (
                                <Utensils className="mr-1 h-2.5 w-2.5" />
                              )}
                              {category}
                            </Badge>
                          ))}
                          {isUserSpeaker && (
                            <Badge
                              variant="default"
                              className="bg-green-600 text-white dark:bg-green-700 text-xs"
                            >
                              <Check className="mr-1 h-2.5 w-2.5" />
                              Spreker
                            </Badge>
                          )}
                          {isRegistered && !isUserSpeaker && (
                            <Badge
                              variant="default"
                              className="bg-green-600 text-white dark:bg-green-700 text-xs"
                            >
                              <Check className="mr-1 h-2.5 w-2.5" />
                              Ingeschreven
                            </Badge>
                          )}
                        </div>

                        <Link href={`/sessies/${session.slug}`}>
                          <h4
                            className="text-lg font-semibold leading-tight hover:text-primary cursor-pointer transition-colors"
                            data-testid={`timeline-title-${session.id}`}
                          >
                            {session.title}
                          </h4>
                        </Link>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            <span>
                              {formatTime(session.startTime)} - {formatTime(session.endTime)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>{session.room}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5" />
                            <span>
                              {session.capacity 
                                ? `${session.attendees.length} van ${session.capacity}`
                                : `${session.attendees.length} deelnemer${session.attendees.length !== 1 ? "s" : ""}`
                              }
                            </span>
                          </div>
                        </div>

                        {userEmail && session.speakers.length > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-1.5">
                              {session.speakers.slice(0, 3).map((speaker) => (
                                <Avatar key={speaker.email} className="h-5 w-5 border border-background">
                                  {speaker.photoUrl ? (
                                    <AvatarImage src={speaker.photoUrl} alt={speaker.name} />
                                  ) : null}
                                  <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                                    {getInitials(speaker.name)}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                            </div>
                            <span className="text-sm font-medium">
                              {session.speakers.map(s => s.name).join(" & ")}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-2 md:flex-col md:items-end">
                        {userEmail ? (
                          isUserSpeaker ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled
                              data-testid={`timeline-speaker-${session.id}`}
                            >
                              Spreker
                            </Button>
                          ) : isRegistered ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onUnregister(session.id)}
                              disabled={isPending}
                              data-testid={`timeline-unregister-${session.id}`}
                            >
                              Uitschrijven
                            </Button>
                          ) : session.capacity && session.attendees.length >= session.capacity ? (
                            <Button
                              size="sm"
                              disabled
                              data-testid={`timeline-register-${session.id}`}
                            >
                              Vol
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => onRegister(session.id)}
                              disabled={isPending}
                              data-testid={`timeline-register-${session.id}`}
                            >
                              Inschrijven
                            </Button>
                          )
                        ) : (
                          <Button variant="secondary" size="sm" disabled>
                            Log in
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
