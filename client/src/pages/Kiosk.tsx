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
    title: "Eten & Drinken",
    room: "Foyer",
    startTime: "2026-04-16T15:45:00",
    endTime: "2026-04-16T16:15:00",
    speakers: [],
    categories: ["Eten & Drinken"],
  },
  {
    id: "5",
    title: "Design Systems bij Caesar",
    room: "Zaal 1 — Auditorium",
    startTime: "2026-04-16T16:00:00",
    endTime: "2026-04-16T16:45:00",
    speakers: [{ name: "Emma Willems" }],
    categories: ["Kennissessie"],
  },
  {
    id: "6",
    title: "Security Awareness",
    room: "Zaal 2 — Workshopruimte",
    startTime: "2026-04-16T16:15:00",
    endTime: "2026-04-16T17:00:00",
    speakers: [{ name: "Martijn de Boer" }],
    categories: ["Deepdive"],
  },
  {
    id: "7",
    title: "Lightning Talks",
    room: "Zaal 3 — Innovatielab",
    startTime: "2026-04-16T16:15:00",
    endTime: "2026-04-16T16:45:00",
    speakers: [{ name: "Diverse sprekers" }],
    categories: ["Demo"],
  },
  {
    id: "8",
    title: "Retrospective & Borrel",
    room: "Foyer",
    startTime: "2026-04-16T17:00:00",
    endTime: "2026-04-16T18:00:00",
    speakers: [],
    categories: ["Feedback"],
  },
];

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
}

function getSessionStatus(session: KioskSession, now: Date): "now" | "next" | "later" {
  const start = new Date(session.startTime);
  const end = new Date(session.endTime);
  if (now >= start && now < end) return "now";

  const minutesUntilStart = (start.getTime() - now.getTime()) / 60000;
  if (minutesUntilStart > 0 && minutesUntilStart <= 30) return "next";

  return "later";
}

function SessionCard({ session, status }: { session: KioskSession; status: "now" | "next" | "later" }) {
  const isNow = status === "now";
  const isNext = status === "next";

  return (
    <div
      className={`
        rounded-2xl border-2 p-6 transition-all
        ${isNow
          ? "border-green-400 bg-green-50 dark:bg-green-950/30 dark:border-green-600 shadow-lg shadow-green-100 dark:shadow-green-900/20"
          : isNext
            ? "border-amber-400 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-600 shadow-md shadow-amber-100 dark:shadow-amber-900/20"
            : "border-border/50 bg-muted/30"
        }
      `}
      data-testid={`kiosk-session-${session.id}`}
    >
      <div className="flex items-center gap-3 mb-3">
        {isNow && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-600 px-3 py-1 text-sm font-bold text-white animate-pulse" data-testid="badge-now">
            <span className="h-2 w-2 rounded-full bg-white" />
            NU BEZIG
          </span>
        )}
        {isNext && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-sm font-bold text-white" data-testid="badge-next">
            HIERNA
          </span>
        )}
        {status === "later" && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
            LATER
          </span>
        )}
        {session.categories.length > 0 && (
          <span className="text-sm text-muted-foreground font-medium">
            {session.categories.join(", ")}
          </span>
        )}
      </div>

      <h3
        className={`font-bold mb-2 leading-tight ${isNow ? "text-2xl" : isNext ? "text-xl" : "text-lg text-muted-foreground"}`}
        data-testid={`kiosk-title-${session.id}`}
      >
        {session.title}
      </h3>

      {session.speakers.length > 0 && (
        <div className={`flex items-center gap-2 mb-3 ${status === "later" ? "text-muted-foreground/70" : "text-muted-foreground"}`}>
          <User className="h-4 w-4 shrink-0" />
          <span className={`${isNow ? "text-base" : "text-sm"}`}>
            {session.speakers.map(s => s.name).join(", ")}
          </span>
        </div>
      )}

      <div className={`flex items-center gap-4 ${status === "later" ? "text-muted-foreground/60" : "text-muted-foreground"}`}>
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 shrink-0" />
          <span className={`${isNow ? "text-base font-medium" : "text-sm"}`}>
            {formatTime(session.startTime)} – {formatTime(session.endTime)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Kiosk() {
  const [now, setNow] = useState(() => {
    const d = new Date("2026-04-16T15:20:00");
    return d;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(prev => new Date(prev.getTime() + 60000));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    document.title = "Caesar Forum — Kiosk";
  }, []);

  const rooms = [...new Set(DUMMY_SESSIONS.map(s => s.room))];

  const sessionsByRoom: Record<string, { now: KioskSession[]; next: KioskSession[]; later: KioskSession[] }> = {};
  for (const room of rooms) {
    sessionsByRoom[room] = { now: [], next: [], later: [] };
  }
  for (const session of DUMMY_SESSIONS) {
    const status = getSessionStatus(session, now);
    sessionsByRoom[session.room][status].push(session);
  }

  const activeRooms = rooms.filter(
    room => sessionsByRoom[room].now.length > 0 || sessionsByRoom[room].next.length > 0 || sessionsByRoom[room].later.length > 0
  );

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
        <div
          className="grid gap-6 h-full"
          style={{ gridTemplateColumns: `repeat(${activeRooms.length}, 1fr)` }}
        >
          {activeRooms.map(room => (
            <div key={room} className="flex flex-col gap-4 min-w-0" data-testid={`kiosk-room-${room}`}>
              <div className="flex items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-5 py-3 text-primary-foreground shrink-0">
                <MapPin className="h-5 w-5 shrink-0" />
                <h2 className="text-lg font-bold truncate" data-testid={`kiosk-room-name-${room}`}>{room}</h2>
              </div>

              <div className="flex flex-col gap-3 flex-1">
                {sessionsByRoom[room].now.map(s => (
                  <SessionCard key={s.id} session={s} status="now" />
                ))}
                {sessionsByRoom[room].next.map(s => (
                  <SessionCard key={s.id} session={s} status="next" />
                ))}
                {sessionsByRoom[room].later.map(s => (
                  <SessionCard key={s.id} session={s} status="later" />
                ))}

                {sessionsByRoom[room].now.length === 0 && sessionsByRoom[room].next.length === 0 && sessionsByRoom[room].later.length === 0 && (
                  <div className="flex items-center justify-center flex-1 text-muted-foreground text-lg">
                    Geen sessies gepland
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
