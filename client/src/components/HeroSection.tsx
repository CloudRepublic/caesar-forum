import { Button } from "@/components/ui/button";
import { Calendar, Users } from "lucide-react";
import { useMemo } from "react";
import type { ForumEdition, Session } from "@shared/schema";

import backdrop1 from "@assets/backdrops/RL_09185.jpg";
import backdrop2 from "@assets/backdrops/RL_09221.jpg";

const backdropImages = [backdrop1, backdrop2];

function getRandomBackdrop() {
  return backdropImages[Math.floor(Math.random() * backdropImages.length)];
}

interface HeroSectionProps {
  edition: ForumEdition | null;
  sessions: Session[];
  userEmail: string | undefined;
}

export function HeroSection({ edition, sessions, userEmail }: HeroSectionProps) {
  const backdropImage = useMemo(() => getRandomBackdrop(), []);
  
  const totalRegistrations = sessions.reduce(
    (sum, session) => sum + session.attendees.length,
    0
  );
  
  const userRegistrations = userEmail
    ? sessions.filter((s) => s.attendees.includes(userEmail)).length
    : 0;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("nl-NL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const scrollToSessions = () => {
    const sessionsSection = document.getElementById("sessions");
    if (sessionsSection) {
      sessionsSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative min-h-[60vh] overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${backdropImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />

      <div className="relative mx-auto flex min-h-[60vh] max-w-7xl flex-col items-center justify-center px-4 py-20 text-center md:px-8 md:py-32">
        <div className="rounded-xl bg-black/30 px-8 py-8 backdrop-blur-sm md:px-12 md:py-10">
          {edition ? (
            <>
              <h1
                className="mb-4 text-4xl font-bold text-white md:text-5xl"
                data-testid="text-hero-title"
              >
                {edition.title}
              </h1>

              {/* Show date/location when there's an actual event (not "no-events") */}
              {edition.id !== "no-events" && (
                <div className="mb-6 flex flex-wrap items-center justify-center gap-4 text-white/90">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    <span className="text-lg" data-testid="text-hero-date">
                      {formatDate(edition.date)}
                    </span>
                  </div>
                  <span className="hidden text-white/50 md:inline">|</span>
                  <span className="text-lg" data-testid="text-hero-location">
                    {edition.location}
                  </span>
                </div>
              )}

              {/* Show stats when there's an actual event */}
              {edition.id !== "no-events" && (
                <div className="mb-8 flex flex-wrap items-center justify-center gap-6 text-sm text-white/80">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-white" data-testid="text-session-count">
                      {sessions.length}
                    </span>
                    <span>sessies</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="text-2xl font-bold text-white" data-testid="text-registration-count">
                      {totalRegistrations}
                    </span>
                    <span>inschrijvingen</span>
                  </div>
                  {userEmail && userRegistrations > 0 && (
                    <div className="rounded-full bg-white/20 px-3 py-1">
                      <span data-testid="text-user-registrations">
                        Jij: {userRegistrations} sessie{userRegistrations !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Only show button when there are actual sessions to view */}
              {sessions.length > 0 && (
                <Button
                  size="lg"
                  onClick={scrollToSessions}
                  className="bg-white text-black hover:bg-white/90"
                  data-testid="button-view-sessions"
                >
                  Bekijk Sessies
                </Button>
              )}
            </>
          ) : (
            <>
              <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl">
                Caesar Forum
              </h1>
              <p className="text-lg text-white/80">
                Er is momenteel geen aankomend event gepland.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
