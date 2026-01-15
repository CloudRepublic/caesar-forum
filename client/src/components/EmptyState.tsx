import { Calendar, Search, Users, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  type: "no-events" | "no-sessions" | "no-results" | "no-registrations" | "error";
  searchQuery?: string;
  errorMessage?: string;
  onRetry?: () => void;
}

const emptyStates = {
  "no-events": {
    icon: Calendar,
    title: "Geen aankomende events",
    description: "Er is momenteel geen Caesar Forum gepland. Check later opnieuw.",
  },
  "no-sessions": {
    icon: Users,
    title: "Geen sessies beschikbaar",
    description: "Er zijn nog geen sessies toegevoegd voor dit event.",
  },
  "no-results": {
    icon: Search,
    title: "Geen sessies gevonden",
    description: "Probeer andere zoektermen of filters.",
  },
  "no-registrations": {
    icon: Calendar,
    title: "Je bent nog niet ingeschreven",
    description: "Ga naar het Dashboard om je in te schrijven voor sessies.",
  },
  "error": {
    icon: AlertTriangle,
    title: "Er is iets misgegaan",
    description: "De verbinding met Microsoft Outlook is tijdelijk niet beschikbaar. Probeer het later opnieuw.",
  },
};

export function EmptyState({ type, searchQuery, errorMessage, onRetry }: EmptyStateProps) {
  const state = emptyStates[type];
  const Icon = state.icon;

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center" data-testid={`empty-state-${type}`}>
      <div className={`mb-4 rounded-full p-4 ${type === "error" ? "bg-destructive/10" : "bg-muted"}`}>
        <Icon className={`h-8 w-8 ${type === "error" ? "text-destructive" : "text-muted-foreground"}`} />
      </div>
      <h3 className="mb-2 text-lg font-semibold">{state.title}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">
        {type === "no-results" && searchQuery
          ? `Geen sessies gevonden voor "${searchQuery}". Probeer andere zoektermen.`
          : type === "error" && errorMessage
          ? errorMessage
          : state.description}
      </p>
      {type === "error" && onRetry && (
        <Button 
          variant="outline" 
          className="mt-4" 
          onClick={onRetry}
          data-testid="button-retry"
        >
          Opnieuw proberen
        </Button>
      )}
    </div>
  );
}
