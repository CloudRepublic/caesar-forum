import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useUser } from "@/context/UserContext";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Layers, CheckCircle2, ChevronRight, ChevronLeft, ShieldAlert, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PhaseData {
  editionId: string;
  editionTitle: string;
  phase: number;
}

const phases = [
  {
    number: 1,
    title: "Sessies aanmelden",
    description: "Bezoekers zien een uitnodiging om sessies aan te melden. Alleen admins zien de sessies.",
    icon: FileText,
  },
  {
    number: 2,
    title: "Programma samenstellen",
    description: "Bezoekers zien de sessies (zonder tijden en volgorde). Inschrijven is nog niet mogelijk.",
    icon: Layers,
  },
  {
    number: 3,
    title: "Klaar voor inschrijvingen",
    description: "Volledige weergave voor iedereen. Inschrijven is mogelijk.",
    icon: CheckCircle2,
  },
];

export default function Admin() {
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Caesar Forum - Admin";
  }, []);

  const { data: adminCheck, isLoading: isCheckingAdmin } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin-check"],
    queryFn: async () => {
      const res = await fetch("/api/admin-check");
      if (!res.ok) return { isAdmin: false };
      return res.json();
    },
    enabled: !!user,
  });

  const { data: phaseData, isLoading: isLoadingPhase } = useQuery<PhaseData>({
    queryKey: ["/api/admin/phase"],
    queryFn: async () => {
      const res = await fetch("/api/admin/phase");
      if (!res.ok) throw new Error("Kon fase niet ophalen");
      return res.json();
    },
    enabled: !!user && adminCheck?.isAdmin === true,
  });

  const phaseMutation = useMutation({
    mutationFn: async ({ editionId, phase }: { editionId: string; phase: number }) => {
      return apiRequest("POST", "/api/admin/phase", { editionId, phase });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/phase"] });
      queryClient.invalidateQueries({ queryKey: ["/api/forum"] });
      const phaseName = phases.find(p => p.number === variables.phase)?.title;
      toast({
        title: "Fase bijgewerkt",
        description: `Het programma staat nu in fase ${variables.phase}: ${phaseName}.`,
      });
    },
    onError: () => {
      toast({
        title: "Fout",
        description: "De fase kon niet worden bijgewerkt. Probeer het opnieuw.",
        variant: "destructive",
      });
    },
  });

  // Redirect if not logged in
  if (!user && !isCheckingAdmin) {
    setLocation("/");
    return null;
  }

  // Show access denied if not admin
  if (!isCheckingAdmin && adminCheck && !adminCheck.isAdmin) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4" data-testid="section-admin-denied">
        <div className="rounded-full bg-destructive/10 p-4">
          <ShieldAlert className="h-10 w-10 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold">Geen toegang</h1>
        <p className="text-center text-muted-foreground">
          Je hebt geen toegang tot het admin-paneel.
        </p>
        <Button variant="outline" onClick={() => setLocation("/")} data-testid="button-admin-back">
          Terug naar dashboard
        </Button>
      </div>
    );
  }

  const isLoading = isCheckingAdmin || isLoadingPhase;
  const currentPhase = phaseData?.phase ?? 1;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-8" data-testid="page-admin">
      <div className="mb-8">
        <h1 className="text-3xl font-bold" data-testid="text-admin-title">Admin</h1>
        {phaseData?.editionTitle && (
          <p className="mt-1 text-muted-foreground" data-testid="text-admin-edition">
            {phaseData.editionTitle}
          </p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Programma fase</CardTitle>
          <CardDescription>
            Stel in welke fase het aankomende Forum-programma zich in bevindt.
            Dit bepaalt wat bezoekers te zien krijgen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {phases.map((phase) => {
                const Icon = phase.icon;
                const isActive = currentPhase === phase.number;
                const isPast = currentPhase > phase.number;

                return (
                  <div
                    key={phase.number}
                    className={`flex items-start gap-4 rounded-lg border p-4 transition-colors ${
                      isActive
                        ? "border-primary bg-primary/5"
                        : isPast
                        ? "border-border bg-muted/30 opacity-60"
                        : "border-border"
                    }`}
                    data-testid={`section-phase-${phase.number}`}
                  >
                    <div
                      className={`mt-0.5 rounded-full p-2 ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : isPast
                          ? "bg-muted text-muted-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{phase.title}</span>
                        {isActive && (
                          <Badge variant="default" className="text-xs" data-testid={`badge-active-phase-${phase.number}`}>
                            Actief
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {phase.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!isLoading && phaseData && (
            <div className="mt-6 flex items-center justify-between gap-3 border-t pt-6">
              <Button
                variant="outline"
                onClick={() =>
                  phaseMutation.mutate({ editionId: phaseData.editionId, phase: currentPhase - 1 })
                }
                disabled={currentPhase <= 1 || phaseMutation.isPending}
                data-testid="button-phase-previous"
              >
                <ChevronLeft className="mr-1.5 h-4 w-4" />
                Vorige fase
              </Button>

              <span className="text-sm text-muted-foreground">
                Fase {currentPhase} van {phases.length}
              </span>

              <Button
                onClick={() =>
                  phaseMutation.mutate({ editionId: phaseData.editionId, phase: currentPhase + 1 })
                }
                disabled={currentPhase >= phases.length || phaseMutation.isPending}
                data-testid="button-phase-next"
              >
                Volgende fase
                <ChevronRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
