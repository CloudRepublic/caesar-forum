import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, MapPin, Users, Check, Utensils, MessageSquare, Presentation, Upload } from "lucide-react";
import { isEmailInAttendees, isSpeaker } from "@/lib/email-utils";
import { getInitials } from "@/lib/utils";
import type { Session } from "@shared/schema";
import foodDrinkBg from "@assets/image_1768474260490.png";
import { useUser } from "@/context/UserContext";
import { SlideDeckDialog } from "@/components/SlideDeckDialog";
import { SlideDeckUploadDialog } from "@/components/SlideDeckUploadDialog";
import { useQueryClient } from "@tanstack/react-query";

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
  isPastEdition?: boolean;
  editionDate?: string;
  hideTimeAndRoom?: boolean;
  registrationDisabled?: boolean;
  isAdmin?: boolean;
}

export function SessionCard({
  session,
  userEmail,
  onRegister,
  onUnregister,
  isPending = false,
  isPastEdition = false,
  editionDate,
  hideTimeAndRoom = false,
  registrationDisabled = false,
  isAdmin = false,
}: SessionCardProps) {
  const { login } = useUser();
  const queryClient = useQueryClient();
  const isRegistered = userEmail ? isEmailInAttendees(userEmail, session.attendees) : false;
  const isUserSpeaker = userEmail ? isSpeaker(userEmail, session.speakers) : false;
  const canManageSlidedeck = !!userEmail && (isUserSpeaker || isAdmin);

  const [showSlidedeck, setShowSlidedeck] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("nl-NL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isFoodDrink = isFoodDrinkSession(session.categories || []);

  return (
    <>
      <Card
        className={`flex flex-col ${isFoodDrink ? "relative overflow-hidden" : ""}`}
        style={isFoodDrink ? {
          backgroundImage: `url(${foodDrinkBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        } : {}}
      >
        {isFoodDrink && (
          <div className="absolute inset-0 bg-background/85" />
        )}
        <div className={`flex flex-col flex-1 ${isFoodDrink ? "relative" : ""}`}>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {(session.categories || []).filter(c => c.toLowerCase() !== "beheer").map((category) => (
              <Badge
                key={category}
                className={`text-xs font-medium no-default-hover-elevate no-default-active-elevate ${getCategoryColors(category)}`}
              >
                {category}
              </Badge>
            ))}
          </div>
          <h3 className="text-base font-semibold leading-snug">{session.title}</h3>
        </CardHeader>

        <CardContent className="pb-4 flex-1">
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
            {session.description}
          </p>

          {!hideTimeAndRoom && (
            <div className="flex flex-col gap-1.5 text-sm text-muted-foreground mb-3">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {formatTime(session.startTime)} – {formatTime(session.endTime)}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {session.room}
              </span>
            </div>
          )}

          {session.speakers.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {session.speakers.map((speaker) => (
                <div key={speaker.email} className="flex items-center gap-1.5">
                  <Avatar className="h-6 w-6">
                    {speaker.photoUrl ? (
                      <AvatarImage src={speaker.photoUrl} alt={speaker.name} />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {getInitials(speaker.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">{speaker.name}</span>
                </div>
              ))}
            </div>
          )}

          {session.speakerCount !== undefined && session.speakers.length === 0 && session.speakerCount > 0 && (
            <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              {session.speakerCount} {session.speakerCount === 1 ? "spreker" : "sprekers"}
            </div>
          )}

          <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            {session.showDietaryForm && (
              <span className="flex items-center gap-1">
                <Utensils className="h-3.5 w-3.5" />
                Dieetvoorkeur
              </span>
            )}
            {isRegistered && (
              <span className="flex items-center gap-1 text-green-600">
                <Check className="h-3.5 w-3.5" />
                Ingeschreven
              </span>
            )}
            {(() => {
              const count = session.attendeeCount ?? session.attendees.length;
              if (count === 0) return null;
              return session.capacity
                ? `${count} van ${session.capacity} deelnemers`
                : `${count} deelnemer${count !== 1 ? "s" : ""}`;
            })()}
          </div>
        </CardContent>

        <CardFooter className="pt-4">
          {isPastEdition ? (
            <div className="flex flex-col gap-2 w-full">
              {/* Main action row: Feedback + Slidedeck */}
              {userEmail && (session.speakers.length > 0 || session.slidedeck) && (
                <div className="flex gap-2">
                  {session.speakers.length > 0 && (
                    <Link
                      href={`/edities/${editionDate}/feedback/${session.id}`}
                      className={session.slidedeck ? "flex-1" : "w-full"}
                    >
                      <Button
                        variant="outline"
                        className="w-full"
                        data-testid={`button-feedback-${session.id}`}
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Geef feedback
                      </Button>
                    </Link>
                  )}
                  {session.slidedeck && (
                    <Button
                      variant="outline"
                      className={session.speakers.length > 0 ? "flex-1" : "w-full"}
                      onClick={() => setShowSlidedeck(true)}
                      data-testid={`button-slidedeck-${session.id}`}
                    >
                      <Presentation className="mr-2 h-4 w-4" />
                      Slidedeck
                    </Button>
                  )}
                </div>
              )}
              {/* Upload row: only for speakers/admins */}
              {canManageSlidedeck && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                  onClick={() => setShowUpload(true)}
                  data-testid={`button-upload-slidedeck-${session.id}`}
                >
                  <Upload className="mr-2 h-3.5 w-3.5" />
                  {session.slidedeck ? "Slidedeck beheren" : "Slidedeck uploaden"}
                </Button>
              )}
            </div>
          ) : registrationDisabled ? (
            <Button
              variant="secondary"
              className="w-full"
              disabled
              data-testid={`button-register-disabled-${session.id}`}
            >
              Inschrijven nog niet mogelijk
            </Button>
          ) : userEmail ? (
            isUserSpeaker ? (
              <Button
                variant="secondary"
                className="w-full"
                disabled
                data-testid={`button-speaker-${session.id}`}
              >
                Je bent spreker
              </Button>
            ) : isRegistered ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => onUnregister(session.id)}
                disabled={isPending}
                data-testid={`button-unregister-${session.id}`}
              >
                Uitschrijven
              </Button>
            ) : session.capacity && (session.attendeeCount ?? session.attendees.length) >= session.capacity ? (
              <Button
                className="w-full"
                disabled
                data-testid={`button-register-${session.id}`}
              >
                Sessie is vol
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
            <Button variant="secondary" className="w-full" onClick={login} data-testid={`button-login-${session.id}`}>
              Log in om in te schrijven
            </Button>
          )}
        </CardFooter>
        </div>
      </Card>

      {/* Dialogs */}
      {session.slidedeck && (
        <SlideDeckDialog
          open={showSlidedeck}
          onOpenChange={setShowSlidedeck}
          sessionId={session.id}
          filename={session.slidedeck.filename}
          contentType={session.slidedeck.contentType}
        />
      )}
      {canManageSlidedeck && (
        <SlideDeckUploadDialog
          open={showUpload}
          onOpenChange={setShowUpload}
          sessionId={session.id}
          sessionTitle={session.title}
          existing={session.slidedeck}
          onChanged={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/editions"] });
          }}
        />
      )}
    </>
  );
}
