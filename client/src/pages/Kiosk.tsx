import { useState, useEffect } from "react";
import { Clock, MapPin, User, Monitor } from "lucide-react";

interface KioskSession {
  id: string;
  title: string;
  room: string;
  startTime: string;
  endTime: string;
  speakers: { name: string }[];
  categories: string[];
}

const DUMMY_SESSIONS: KioskSession[] = [
  {
    id: "1",
    title: "Hoe kleur kleurt",
    room: "Zaal 1 — Auditorium",
    startTime: "2026-04-16T15:00:00",
    endTime: "2026-04-16T15:45:00",
    speakers: [{ name: "Lisa de Vries" }],
    categories: ["Kennissessie"],
  },
  {
    id: "2",
    title: "Getting started with Svelte",
    room: "Zaal 2 — Workshopruimte",
    startTime: "2026-04-16T15:00:00",
    endTime: "2026-04-16T16:00:00",
    speakers: [{ name: "Pieter Jansen" }],
    categories: ["Workshop"],
  },
  {
    id: "3",
    title: "AI in de praktijk",
    room: "Zaal 3 — Innovatielab",
    startTime: "2026-04-16T15:00:00",
    endTime: "2026-04-16T15:30:00",
    speakers: [{ name: "Sarah Bakker" }, { name: "Tom Hendriks" }],
    categories: ["Demo"],
  },
  {
    id: "4",
    title: "Design Systems bij Caesar",
    room: "Zaal 1 — Auditorium",
    startTime: "2026-04-16T15:50:00",
    endTime: "2026-04-16T16:35:00",
    speakers: [{ name: "Emma Willems" }],
    categories: ["Kennissessie"],
  },
  {
    id: "5",
    title: "Accessibility Workshop",
    room: "Zaal 3 — Innovatielab",
    startTime: "2026-04-16T15:35:00",
    endTime: "2026-04-16T16:20:00",
    speakers: [{ name: "Nadia El Amrani" }],
    categories: ["Workshop"],
  },
  {
    id: "6",
    title: "Security Awareness",
    room: "Zaal 2 — Workshopruimte",
    startTime: "2026-04-16T16:05:00",
    endTime: "2026-04-16T16:50:00",
    speakers: [{ name: "Martijn de Boer" }],
    categories: ["Deepdive"],
  },
  {
    id: "7",
    title: "Lightning Talks",
    room: "Zaal 1 — Auditorium",
    startTime: "2026-04-16T16:40:00",
    endTime: "2026-04-16T17:10:00",
    speakers: [{ name: "Diverse sprekers" }],
    categories: ["Demo"],
  },
  {
    id: "8",
    title: "GraphQL in productie",
    room: "Zaal 3 — Innovatielab",
    startTime: "2026-04-16T16:25:00",
    endTime: "2026-04-16T17:10:00",
    speakers: [{ name: "Ruben Visser" }],
    categories: ["Deepdive"],
  },
  {
    id: "9",
    title: "Retrospective & Borrel",
    room: "Zaal 2 — Workshopruimte",
    startTime: "2026-04-16T17:00:00",
    endTime: "2026-04-16T18:00:00",
    speakers: [],
    categories: ["Feedback"],
  },
  {
    id: "10",
    title: "Diner",
    room: "Lobby",
    startTime: "2026-04-16T15:45:00",
    endTime: "2026-04-16T16:30:00",
    speakers: [],
    categories: ["Eten & Drinken"],
  },
  {
    id: "11",
    title: "Borrel",
    room: "Lobby",
    startTime: "2026-04-16T17:15:00",
    endTime: "2026-04-16T18:00:00",
    speakers: [],
    categories: ["Eten & Drinken"],
  },
];

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
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
  const futureSessions = sessions
    .filter(s => new Date(s.startTime) > now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  if (futureSessions.length === 0) return new Set();

  const earliestStart = new Date(futureSessions[0].startTime).getTime();
  const nextIds = new Set<string>();
  for (const s of futureSessions) {
    if (new Date(s.startTime).getTime() === earliestStart) {
      nextIds.add(s.id);
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
  const isLater = status === "later";
  const isCompact = heightPx < 120;

  return (
    <div
      className={`
        rounded-2xl border-2 p-4 overflow-hidden flex flex-col justify-between transition-all
        ${isNow
          ? "border-green-400 bg-green-50 dark:bg-green-950/30 dark:border-green-600 shadow-lg shadow-green-100 dark:shadow-green-900/20"
          : isNext
            ? "border-amber-400 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-600 shadow-md shadow-amber-100 dark:shadow-amber-900/20"
            : "border-border/40 bg-muted/30 opacity-70"
        }
      `}
      style={{ height: `${heightPx}px`, minHeight: "60px" }}
      data-testid={`kiosk-session-${session.id}`}
    >
      <div>
        <div className="flex items-center gap-2 mb-1">
          {isNow && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-600 px-2.5 py-0.5 text-xs font-bold text-white animate-pulse" data-testid="badge-now">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              NU BEZIG
            </span>
          )}
          {isNext && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-bold text-white" data-testid="badge-next">
              AANKOMEND
            </span>
          )}
          {isLater && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              LATER
            </span>
          )}
          {session.categories.length > 0 && (
            <span className={`text-xs font-medium ${isLater ? "text-muted-foreground/70" : "text-muted-foreground"}`}>
              {session.categories.join(", ")}
            </span>
          )}
        </div>

        <h3
          className={`font-bold leading-tight mb-1 ${
            isNow ? "text-xl" : isNext ? "text-lg" : "text-base text-muted-foreground/70"
          } ${isCompact ? "line-clamp-1" : "line-clamp-2"}`}
          data-testid={`kiosk-title-${session.id}`}
        >
          {session.title}
        </h3>

        {session.speakers.length > 0 && !isCompact && (
          <div className={`flex items-center gap-1.5 ${isLater ? "text-muted-foreground/60" : "text-muted-foreground"}`}>
            <User className="h-3.5 w-3.5 shrink-0" />
            <span className="text-sm truncate">
              {session.speakers.map(s => s.name).join(", ")}
            </span>
          </div>
        )}
      </div>

      <div className={`flex items-center gap-1.5 mt-1 ${isLater ? "text-muted-foreground/60" : "text-muted-foreground"}`}>
        <Clock className="h-3.5 w-3.5 shrink-0" />
        <span className="text-xs font-medium">
          {formatTime(session.startTime)} – {formatTime(session.endTime)}
        </span>
      </div>
    </div>
  );
}

export default function Kiosk() {
  const [now, setNow] = useState(() => new Date("2026-04-16T15:20:00"));

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(prev => new Date(prev.getTime() + 60000));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    document.title = "Caesar Forum — Kiosk";
  }, []);

  const allTimes = DUMMY_SESSIONS.flatMap(s => [
    new Date(s.startTime).getTime(),
    new Date(s.endTime).getTime(),
  ]);
  const timelineStart = Math.min(...allTimes);
  const timelineEnd = Math.max(...allTimes);
  const totalMinutes = (timelineEnd - timelineStart) / 60000;

  const rooms = [...new Set(DUMMY_SESSIONS.map(s => s.room))];

  const nextSessionIds = findNextSessions(DUMMY_SESSIONS, now);

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
      <header className="flex items-center justify-between px-8 py-4 border-b bg-[hsl(var(--primary))] text-primary-foreground shrink-0">
        <div className="flex items-center gap-4">
          <img src="/logo.svg" alt="Caesar Forum" className="h-10 brightness-0 invert" data-testid="kiosk-logo" />
          <div className="h-8 w-px bg-primary-foreground/30" />
          <h1 className="text-2xl font-bold tracking-tight" data-testid="kiosk-title">Sessierooster</h1>
        </div>
        <div className="flex items-center gap-3 text-primary-foreground/80">
          <Monitor className="h-5 w-5" />
          <time className="text-xl font-mono font-semibold tabular-nums" data-testid="kiosk-clock">
            {now.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
          </time>
          <span className="text-lg">
            {now.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" })}
          </span>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6">
        <div className="flex gap-4 h-full">
          <div className="w-16 shrink-0 relative" style={{ height: `${timelineHeightPx}px` }}>
            {timeMarkers.map((marker, i) => (
              <div
                key={i}
                className="absolute right-0 flex items-center gap-1 -translate-y-1/2"
                style={{ top: `${marker.offset}px` }}
              >
                <span className="text-xs font-mono text-muted-foreground font-medium">
                  {marker.time.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>

          <div
            className="flex-1 grid gap-4"
            style={{ gridTemplateColumns: `repeat(${rooms.length}, 1fr)` }}
          >
            {rooms.map(room => {
              const roomSessions = DUMMY_SESSIONS
                .filter(s => s.room === room)
                .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

              return (
                <div key={room} className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-4 py-2.5 text-primary-foreground shrink-0 mb-4">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <h2 className="text-sm font-bold truncate" data-testid={`kiosk-room-name-${room}`}>{room}</h2>
                  </div>

                  <div className="relative" style={{ height: `${timelineHeightPx}px` }}>
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
