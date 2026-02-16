import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Calendar, MapPin, Users, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ForumEdition } from "@shared/schema";

interface PastEdition {
  edition: ForumEdition;
  sessionCount: number;
}

export default function Archive() {
  useEffect(() => {
    document.title = "Caesar Forum - Eerdere edities";
  }, []);

  const { data, isLoading, error } = useQuery<{ editions: PastEdition[] }>({
    queryKey: ["/api/editions"],
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("nl-NL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
        <Skeleton className="mb-2 h-10 w-64" />
        <Skeleton className="mb-8 h-5 w-96" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
        <h1 className="mb-2 text-3xl font-bold">Eerdere edities</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Er is een fout opgetreden bij het ophalen van eerdere edities.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const editions = data?.editions || [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
      <h1 className="mb-2 text-3xl font-bold" data-testid="text-archive-title">Eerdere edities</h1>
      <p className="mb-8 text-muted-foreground">
        Bekijk sessies van eerdere Caesar Forum edities en geef feedback aan de sprekers.
      </p>

      {editions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="mb-2 text-xl font-semibold">Geen eerdere edities</h2>
            <p className="text-muted-foreground">
              Er zijn nog geen eerdere edities gevonden.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {editions.map((item) => (
            <Link key={item.edition.id} href={`/edities/${item.edition.date}`}>
              <Card className="hover-elevate cursor-pointer" data-testid={`card-edition-${item.edition.date}`}>
                <CardContent className="flex items-center justify-between gap-4 py-5">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold truncate" data-testid={`text-edition-title-${item.edition.date}`}>
                      {item.edition.title}
                    </h2>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(item.edition.date)}
                      </span>
                      {item.edition.location && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          {item.edition.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        {item.sessionCount} {item.sessionCount === 1 ? "sessie" : "sessies"}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
