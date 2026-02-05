import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Utensils, Lock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/context/UserContext";
import { getInitials } from "@/lib/utils";

interface DietaryPreference {
  email: string;
  name: string;
  preference: string;
  submittedAt: string;
}

interface SessionWithPreferences {
  session: { id: string; title: string; slug: string };
  preferences: DietaryPreference[];
}

interface DietaryResponse {
  sessions: SessionWithPreferences[];
}

export default function DietaryAdmin() {
  const { user } = useUser();

  const { data: adminCheck } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/dietary-preferences/admin-check"],
    queryFn: async () => {
      const res = await fetch("/api/dietary-preferences/admin-check");
      if (!res.ok) throw new Error("Failed to check admin status");
      return res.json();
    },
    enabled: !!user,
  });

  const { data, isLoading, error } = useQuery<DietaryResponse>({
    queryKey: ["/api/dietary-preferences"],
    queryFn: async () => {
      const res = await fetch("/api/dietary-preferences");
      if (!res.ok) {
        if (res.status === 403) throw new Error("FORBIDDEN");
        throw new Error("Failed to fetch preferences");
      }
      return res.json();
    },
    enabled: !!user && adminCheck?.isAdmin,
  });

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Lock className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="mb-2 text-xl font-semibold">Niet ingelogd</h2>
            <p className="text-muted-foreground">
              Log in om deze pagina te bekijken.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!adminCheck) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
        <Skeleton className="mb-4 h-8 w-64" />
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!adminCheck.isAdmin) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Terug naar overzicht
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <Lock className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="mb-2 text-xl font-semibold">Geen toegang</h2>
            <p className="text-muted-foreground">
              Je hebt geen toegang tot het dieetwensen overzicht.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Terug naar overzicht
        </Link>
        <Skeleton className="mb-4 h-8 w-64" />
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Terug naar overzicht
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
            <h2 className="mb-2 text-xl font-semibold">Fout</h2>
            <p className="text-muted-foreground">
              Er is een fout opgetreden bij het laden van dieetwensen.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalPreferences = data?.sessions.reduce(
    (acc, s) => acc + s.preferences.length,
    0
  ) || 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
        data-testid="link-back"
      >
        <ArrowLeft className="h-4 w-4" />
        Terug naar overzicht
      </Link>

      <div className="mb-8 flex items-center gap-3">
        <Utensils className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold md:text-3xl" data-testid="text-page-title">
            Dieetwensen Overzicht
          </h1>
          <p className="text-muted-foreground">
            {totalPreferences} {totalPreferences === 1 ? "dieetwens" : "dieetwensen"} voor {data?.sessions.length || 0} {(data?.sessions.length || 0) === 1 ? "sessie" : "sessies"}
          </p>
        </div>
      </div>

      {!data?.sessions.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Utensils className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="mb-2 text-xl font-semibold">Geen dieetwensen</h2>
            <p className="text-muted-foreground">
              Er zijn nog geen dieetwensen ingediend.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {data.sessions.map((item) => (
            <Card key={item.session.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <Link href={`/sessies/${item.session.slug}`}>
                    <CardTitle className="text-lg hover:underline cursor-pointer" data-testid={`text-session-title-${item.session.id}`}>
                      {item.session.title}
                    </CardTitle>
                  </Link>
                  <Badge variant="secondary" className="no-default-hover-elevate no-default-active-elevate">
                    {item.preferences.length} {item.preferences.length === 1 ? "dieetwens" : "dieetwensen"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {item.preferences.map((pref, idx) => (
                    <div
                      key={pref.email}
                      className="flex items-start gap-3 border-b pb-4 last:border-0 last:pb-0"
                      data-testid={`dietary-preference-${idx}`}
                    >
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage
                          src={`/api/users/${encodeURIComponent(pref.email)}/photo`}
                          alt={pref.name}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {getInitials(pref.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold truncate" data-testid={`text-preference-name-${idx}`}>
                            {pref.name}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {new Date(pref.submittedAt).toLocaleDateString("nl-NL", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground" data-testid={`text-preference-email-${idx}`}>
                          {pref.email}
                        </p>
                        <p className="mt-2 text-sm bg-muted/50 rounded-md p-2 whitespace-pre-wrap" data-testid={`text-preference-content-${idx}`}>
                          {pref.preference}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
