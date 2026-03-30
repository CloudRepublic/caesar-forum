import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, MapPin, User, Monitor, Utensils } from "lucide-react";
import foodDrinkBg from "@assets/image_1768474260490.png";
import type { ForumData } from "@shared/schema";

interface KioskSession {
  id: string;
  title: string;
  room: string;
  startTime: string;
  endTime: string;
  speakers: { name: string }[];
  categories: string[];
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
}

function isFoodDrinkSession(categories: string[]): boolean {
  return categories.some(c => c.toLowerCase() === "eten & drinken");
}

type SessionStatus = "now" | "next" | "later";

function getSessionStatus(session: KioskSession, now: Date): SessionStatus {
  const start = new Date(session.startTime);
  const end = new Date(session.endTime);
  if (now >= start && now < end) return "now";
  if (start > now) return "later";
  return "later";
}

function findNextSessions(sessions: KioskSession[], now: Date): Set<string> {
  const rooms = Array.from(new Set(sessions.map(s => s.room)));
  const nextIds = new Set<string>();

  for (const room of rooms) {
    const futureSessions = sessions
      .filter(s => s.room === room && new Date(s.startTime) > now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    if (futureSessions.length > 0) {
      nextIds.add(futureSessions[0].id);
    }
  }

  return nextIds;
}

function SessionBlock({
  session,
  status,
  heightPx,
}: {
  session: KioskSession;
  status: SessionStatus;
  heightPx: number;
}) {
  const isNow = status === "now";
  const isNext = status === "next";
  const isCompact = heightPx < 140;
  const isFoodDrink = isFoodDrinkSession(session.categories);

  return (
    <div
      className={`
        rounded-2xl border-2 p-5 overflow-hidden flex flex-col justify-between transition-all relative
        ${isNow
          ? "border-green-400 bg-green-50 dark:bg-green-950/30 dark:border-green-600 shadow-lg shadow-green-100 dark:shadow-green-900/20"
          : isNext
            ? "border-amber-400 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-600 shadow-md shadow-amber-100 dark:shadow-amber-900/20"
            : "border-border bg-card"
        }
      `}
      style={{ height: `${heightPx}px`, minHeight: "60px" }}
      data-testid={`kiosk-session-${session.id}`}
    >
      {isFoodDrink && (
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.12] dark:opacity-[0.10]"
          style={{
            backgroundImage: `url(${foodDrinkBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      )}
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-1.5">
          {isNow && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-600 px-3 py-1 text-sm font-bold text-white animate-pulse" data-testid="badge-now">
              <span className="h-2 w-2 rounded-full bg-white" />
              NU BEZIG
            </span>
          )}
          {isNext && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-sm font-bold text-white" data-testid="badge-next">
              AANKOMEND
            </span>
          )}
          {status === "later" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
              LATER
            </span>
          )}
          {session.categories.length > 0 && (
            <span className="text-sm font-medium text-muted-foreground">
              {isFoodDrink && <Utensils className="inline mr-1 h-3.5 w-3.5" />}
              {session.categories.join(", ")}
            </span>
          )}
        </div>

        <h3
          className={`font-bold leading-tight mb-1 ${
            isNow ? "text-2xl" : isNext ? "text-xl" : "text-lg"
          } ${isCompact ? "line-clamp-1" : "line-clamp-2"}`}
          data-testid={`kiosk-title-${session.id}`}
        >
          {session.title}
        </h3>

        {session.speakers.length > 0 && !isCompact && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-4 w-4 shrink-0" />
            <span className="text-base truncate">
              {session.speakers.map(s => s.name).join(", ")}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mt-1 text-muted-foreground relative z-10">
        <Clock className="h-4 w-4 shrink-0" />
        <span className="text-sm font-medium">
          {formatTime(session.startTime)} – {formatTime(session.endTime)}
        </span>
      </div>
    </div>
  );
}

export default function Kiosk() {
  const [now, setNow] = useState(() => new Date(new Date().toISOString().replace(/^\d{4}-\d{2}-\d{2}/, "2026-04-16")));

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(prev => new Date(new Date().toISOString().replace(/^\d{4}-\d{2}-\d{2}/, "2026-04-16")));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    document.title = "Caesar Forum — Kiosk";
  }, []);

  const { data, isLoading } = useQuery<ForumData>({
    queryKey: ["/api/forum"],
  });

  const sessions: KioskSession[] = (data?.sessions ?? []).map(s => ({
    id: s.id,
    title: s.title,
    room: s.room,
    startTime: s.startTime,
    endTime: s.endTime,
    speakers: s.speakers,
    categories: s.categories,
  }));

  if (isLoading || sessions.length === 0) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background" data-testid="kiosk-container">
        <div className="text-center text-muted-foreground">
          <Monitor className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-xl font-semibold">{isLoading ? "Rooster laden…" : "Geen sessies gevonden"}</p>
        </div>
      </div>
    );
  }

  const allTimes = sessions.flatMap(s => [
    new Date(s.startTime).getTime(),
    new Date(s.endTime).getTime(),
  ]);
  const timelineStart = Math.min(...allTimes);
  const timelineEnd = Math.max(...allTimes);
  const totalMinutes = (timelineEnd - timelineStart) / 60000;

  const rooms = Array.from(new Set(sessions.map(s => s.room)));
  const nextSessionIds = findNextSessions(sessions, now);

  const PIXELS_PER_MINUTE = 5;
  const timelineHeightPx = totalMinutes * PIXELS_PER_MINUTE;
  const GAP = 4;

  const timeMarkers: { time: Date; offset: number }[] = [];
  const firstSlot = new Date(timelineStart);
  firstSlot.setMinutes(Math.ceil(firstSlot.getMinutes() / 15) * 15, 0, 0);
  for (let t = firstSlot.getTime(); t <= timelineEnd; t += 15 * 60000) {
    const offset = ((t - timelineStart) / 60000) * PIXELS_PER_MINUTE;
    timeMarkers.push({ time: new Date(t), offset });
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background overflow-hidden" data-testid="kiosk-container">
      <header className="flex items-center justify-between px-8 py-5 border-b bg-[hsl(var(--primary))] text-primary-foreground shrink-0">
        <div className="flex items-center gap-5">
          <img src="/logo.svg" alt="Caesar Forum" className="h-12 brightness-0 invert" data-testid="kiosk-logo" />
          <div className="h-9 w-px bg-primary-foreground/30" />
          <h1 className="text-3xl font-bold tracking-tight" data-testid="kiosk-title">Sessierooster</h1>
        </div>
        <div className="flex items-center gap-4 text-primary-foreground/80">
          <Monitor className="h-6 w-6" />
          <time className="text-2xl font-mono font-semibold tabular-nums" data-testid="kiosk-clock">
            {now.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
          </time>
          <span className="text-xl">
            {now.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" })}
          </span>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6">
        <div className="flex gap-4 h-full">
          <div className="w-20 shrink-0 relative" style={{ height: `${timelineHeightPx}px` }}>
            {timeMarkers.map((marker, i) => (
              <div
                key={i}
                className="absolute right-0 flex items-center gap-1 -translate-y-1/2"
                style={{ top: `${marker.offset}px` }}
              >
                <span className="text-sm font-mono text-muted-foreground font-semibold">
                  {marker.time.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>

          <div
            className="flex-1 grid gap-4"
            style={{ gridTemplateColumns: `repeat(${rooms.length}, 1fr)` }}
          >
            {rooms.map((room, roomIndex) => {
              const roomSessions = sessions
                .filter(s => s.room === room)
                .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
              const showNowLine = now.getTime() >= timelineStart && now.getTime() <= timelineEnd;
              const nowTopPx = ((now.getTime() - timelineStart) / 60000) * PIXELS_PER_MINUTE;

              return (
                <div key={room} className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-5 py-3 text-primary-foreground shrink-0 mb-4">
                    <MapPin className="h-5 w-5 shrink-0" />
                    <h2 className="text-base font-bold truncate" data-testid={`kiosk-room-name-${room}`}>{room}</h2>
                  </div>

                  <div className="relative" style={{ height: `${timelineHeightPx}px` }}>
                    {showNowLine && (
                      <div
                        className="absolute left-0 right-0 z-20 pointer-events-none"
                        style={{ top: `${nowTopPx}px` }}
                      >
                        {roomIndex === 0 && (
                          <div className="absolute -left-2 h-3 w-3 rounded-full bg-red-500 -translate-y-1/2" />
                        )}
                        <div className="h-0.5 w-full bg-red-500" />
                      </div>
                    )}
                    {roomSessions.map(session => {
                      const startMs = new Date(session.startTime).getTime();
                      const endMs = new Date(session.endTime).getTime();
                      const topPx = ((startMs - timelineStart) / 60000) * PIXELS_PER_MINUTE;
                      const rawHeight = ((endMs - startMs) / 60000) * PIXELS_PER_MINUTE;
                      const heightPx = rawHeight - GAP;

                      const baseStatus = getSessionStatus(session, now);
                      const status: SessionStatus = baseStatus === "later" && nextSessionIds.has(session.id) ? "next" : baseStatus;

                      return (
                        <div
                          key={session.id}
                          className="absolute left-0 right-0"
                          style={{ top: `${topPx}px`, height: `${heightPx}px` }}
                        >
                          <SessionBlock session={session} status={status} heightPx={heightPx} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
