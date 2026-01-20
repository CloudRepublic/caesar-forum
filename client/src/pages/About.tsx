import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Target,
  Lightbulb,
  Users,
  Microscope,
  Sparkles,
  ExternalLink,
  BookOpen,
  Wrench,
  Layers,
  Brain,
} from "lucide-react";

const sessionTypes = [
  {
    icon: BookOpen,
    name: "Kennissessie",
    description: "Deel je kennis en expertise met collega's",
  },
  {
    icon: Wrench,
    name: "Workshop",
    description: "Hands-on sessies waar deelnemers actief meedoen",
  },
  {
    icon: Brain,
    name: "Brainstorm",
    description: "Samen nieuwe ideeën ontwikkelen",
  },
  {
    icon: Microscope,
    name: "Deepdive",
    description: "Diepgaande technische of inhoudelijke sessies",
  },
  {
    icon: Sparkles,
    name: "Anders",
    description: "Een ander format dat beter past bij je talk",
  },
];

const exampleSessions = [
  { type: "Kennissessie", title: "Eerste AI-agent bouwen in Azure Foundry" },
  { type: "Kennissessie", title: "MSSQL naar Databricks: slim migreren" },
  { type: "Workshop", title: "Act now: doelen voor werk & privé" },
  { type: "Workshop", title: "Prompt engineering voor developers" },
  {
    type: "Brainstorm",
    title: "Opvallen op de volgende conferentie – bouw een game",
  },
  {
    type: "Brainstorm",
    title: "Welke IT trends negeren we (misschien onterecht)?",
  },
  { type: "Deepdive", title: "Angular experimental forms" },
  { type: "Deepdive", title: "Thought leadership in de praktijk" },
];

export default function About() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
      <div className="mb-8">
        <h1
          className="text-3xl font-bold tracking-tight"
          data-testid="text-about-title"
        >
          Over Caesar Forum
        </h1>
        <p className="mt-2 text-muted-foreground">
          Het interne platform voor kennisdeling en samenwerking
        </p>
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Doel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-foreground leading-relaxed">
              Caesar Forum is een gevarieerd, unit-overstijgend event met een
              divers aanbod van sessies. Denk aan tech, maar ook aan andere
              onderwerpen die je raken, zoals personal development of
              gezondheid.
            </p>
            <p className="text-foreground leading-relaxed">
              Gebruik het Forum om inspirerende sessies te geven, samen nieuwe
              ideeën te ontwikkelen, een dry-run van een conferentiepresentatie
              te doen en een kijkje te nemen achter de schermen van andere
              units.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Sessie Vormen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              Je kunt sessies indienen in de volgende vormen:
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sessionTypes.map((type) => (
                <div
                  key={type.name}
                  className="flex items-start gap-3 rounded-md border p-3"
                  data-testid={`card-session-type-${type.name.toLowerCase()}`}
                >
                  <type.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <h3 className="font-medium">{type.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {type.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Voorbeelden van Sessies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {exampleSessions.map((session, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-sm"
                  data-testid={`text-example-session-${index}`}
                >
                  <span className="shrink-0 rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {session.type}
                  </span>
                  <span className="text-foreground">{session.title}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Sessie Aanmelden
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-foreground leading-relaxed">
              Het aanmeldformulier is ondertussen geopend. Heb je een leuk idee
              voor een sessie? Meld je sessie direct aan!
            </p>
            <Button asChild data-testid="link-submit-session">
              <a
                href="https://mijncaesar.welder.nl/v2/scan/263915"
                target="_blank"
                rel="noopener noreferrer"
              >
                Sessie Aanmelden
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground/40">
          コナミコマンド
        </p>
      </div>
    </div>
  );
}
