import type { Session, ForumEdition, ForumData } from "@shared/schema";
import { getMicrosoftGraphService } from "./microsoft-graph";

// Mock data for Caesar Forum demo
const mockEdition: ForumEdition = {
  id: "edition-2026-02",
  title: "Caesar Forum - Februari 2026",
  date: "2026-02-20",
  location: "Caesar Hoofdkantoor, Utrecht",
};

const mockSessions: Session[] = [
  {
    id: "session-1",
    title: "Introductie tot AI in IT-dienstverlening",
    description: "Ontdek hoe AI de manier waarop we IT-diensten leveren fundamenteel verandert. Van automatisering tot intelligente assistentie, we bespreken de mogelijkheden en uitdagingen.\n\nIn deze sessie behandelen we:\n- De huidige staat van AI in de IT-sector\n- Praktische toepassingen binnen ons werk\n- De impact op onze dienstverlening aan klanten\n- Ethische overwegingen en verantwoordelijk AI-gebruik\n\nDeze talk is geschikt voor iedereen die meer wil weten over hoe AI onze sector transformeert, ongeacht technische achtergrond.",
    type: "talk",
    startTime: "2026-02-20T14:00:00",
    endTime: "2026-02-20T14:45:00",
    room: "Zaal Amsterdam",
    speakerName: "Emma van den Berg",
    speakerEmail: "emma.vandenberg@caesar.nl",
    speakerPhotoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face",
    attendees: ["jan.devries@caesar.nl", "lisa.bakker@caesar.nl"],
  },
  {
    id: "session-2",
    title: "Workshop: Cloud Architecture Best Practices",
    description: "Hands-on workshop waarin we moderne cloud architectuur patronen verkennen. Breng je laptop mee voor praktische oefeningen met Azure.\n\nWat we gaan doen:\n- Microservices vs monolith architectuur\n- Event-driven design patterns\n- Infrastructure as Code met Terraform\n- Cost optimization strategieën\n\nVereisten: Basis kennis van cloud computing en een laptop met Azure CLI geïnstalleerd.",
    type: "workshop",
    startTime: "2026-02-20T15:00:00",
    endTime: "2026-02-20T16:30:00",
    room: "Zaal Rotterdam",
    speakerName: "Thomas Jansen",
    speakerEmail: "thomas.jansen@caesar.nl",
    speakerPhotoUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
    attendees: ["peter.smit@caesar.nl"],
  },
  {
    id: "session-3",
    title: "De toekomst van Yivi en digitale identiteit",
    description: "Een deep dive in Yivi, onze digitale identiteitsoplossing. Hoe past dit in de bredere Europese context van eIDAS en digitale wallets?\n\nOnderwerpen die aan bod komen:\n- De technische architectuur van Yivi\n- Privacy by design principes\n- European Digital Identity Wallet regulering\n- Onze roadmap voor de komende jaren\n\nDeze sessie geeft inzicht in een van onze kernproducten en de strategische richting die we als Caesar volgen op het gebied van digitale identiteit.",
    type: "talk",
    startTime: "2026-02-20T14:00:00",
    endTime: "2026-02-20T14:45:00",
    room: "Zaal Den Haag",
    speakerName: "Dibran Mulder",
    speakerEmail: "dibran.mulder@caesar.nl",
    speakerPhotoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    attendees: ["anna.visser@caesar.nl", "mark.de.jong@caesar.nl", "sophie.mulder@caesar.nl"],
  },
  {
    id: "session-4",
    title: "Discussie: Remote werken na 2025",
    description: "Een open discussie over de toekomst van thuiswerken en hybride werken binnen Caesar. Deel je ervaringen en ideeën voor de ideale werkplek.\n\nGespreksonderwerpen:\n- Wat werkt goed aan ons huidige hybride model?\n- Welke uitdagingen ervaren we?\n- Hoe behouden we teamcohesie?\n- Tools en faciliteiten die we missen\n\nDit is een interactieve sessie. Iedereen wordt aangemoedigd om actief deel te nemen aan de discussie.",
    type: "discussie",
    startTime: "2026-02-20T15:00:00",
    endTime: "2026-02-20T15:45:00",
    room: "Zaal Amsterdam",
    speakerName: "Kiki van Dijk",
    speakerEmail: "kiki.vandijk@caesar.nl",
    speakerPhotoUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
    attendees: [],
  },
  {
    id: "session-5",
    title: "Low-code ontwikkeling met Power Platform",
    description: "Leer hoe je snel business applicaties bouwt met Microsoft Power Platform. Geschikt voor zowel developers als business gebruikers.\n\nWorkshop inhoud:\n- Power Apps basics: canvas en model-driven apps\n- Power Automate voor workflow automatisering\n- Integratie met bestaande systemen\n- Best practices en governance\n\nGeen programmeerervaring vereist. Breng je laptop mee met een Microsoft 365 account.",
    type: "workshop",
    startTime: "2026-02-20T16:00:00",
    endTime: "2026-02-20T17:30:00",
    room: "Zaal Eindhoven",
    speakerName: "Martijn de Groot",
    speakerEmail: "martijn.degroot@caesar.nl",
    speakerPhotoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face",
    attendees: ["jan.devries@caesar.nl"],
  },
  {
    id: "session-6",
    title: "Security awareness: bescherm je digitale identiteit",
    description: "Praktische tips en trucs om jezelf en je collega's te beschermen tegen cyberdreigingen. Van phishing tot wachtwoordbeheer.\n\nWe behandelen:\n- Herkennen van phishing aanvallen\n- Veilig wachtwoordbeheer met password managers\n- Multi-factor authenticatie best practices\n- Social engineering tactieken\n- Wat te doen bij een beveiligingsincident\n\nNa deze sessie weet je precies hoe je jezelf en onze organisatie beter kunt beschermen.",
    type: "talk",
    startTime: "2026-02-20T16:45:00",
    endTime: "2026-02-20T17:30:00",
    room: "Zaal Amsterdam",
    speakerName: "Roos Hendriks",
    speakerEmail: "roos.hendriks@caesar.nl",
    speakerPhotoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face",
    attendees: ["anna.visser@caesar.nl", "peter.smit@caesar.nl"],
  },
];

export interface IStorage {
  getForumData(): Promise<ForumData>;
  getSession(id: string): Promise<Session | undefined>;
  registerForSession(sessionId: string, userEmail: string, userName?: string): Promise<Session | undefined>;
  unregisterFromSession(sessionId: string, userEmail: string): Promise<Session | undefined>;
}

export class MemStorage implements IStorage {
  private edition: ForumEdition;
  private sessions: Map<string, Session>;

  constructor() {
    this.edition = { ...mockEdition };
    this.sessions = new Map();
    mockSessions.forEach((session) => {
      this.sessions.set(session.id, { ...session, attendees: [...session.attendees] });
    });
  }

  async getForumData(): Promise<ForumData> {
    const sessions = Array.from(this.sessions.values()).sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    return {
      edition: this.edition,
      sessions,
    };
  }

  async getSession(id: string): Promise<Session | undefined> {
    return this.sessions.get(id);
  }

  async registerForSession(sessionId: string, userEmail: string): Promise<Session | undefined> {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    if (!session.attendees.includes(userEmail)) {
      session.attendees.push(userEmail);
    }
    return session;
  }

  async unregisterFromSession(sessionId: string, userEmail: string): Promise<Session | undefined> {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    session.attendees = session.attendees.filter((email) => email !== userEmail);
    return session;
  }
}

export class GraphStorage implements IStorage {
  private memStorage: MemStorage;
  private graphFailures: number = 0;
  private lastGraphAttempt: Date | null = null;
  private readonly MAX_FAILURES = 3;
  private readonly RETRY_DELAY_MS = 60000;

  constructor() {
    this.memStorage = new MemStorage();
  }

  private shouldTryGraph(): boolean {
    if (this.graphFailures >= this.MAX_FAILURES) {
      if (this.lastGraphAttempt && Date.now() - this.lastGraphAttempt.getTime() > this.RETRY_DELAY_MS) {
        console.log("Retrying Microsoft Graph after cooldown period...");
        this.graphFailures = 0;
        return true;
      }
      return false;
    }
    return true;
  }

  private recordGraphSuccess(): void {
    this.graphFailures = 0;
    this.lastGraphAttempt = new Date();
  }

  private recordGraphFailure(error: unknown): void {
    this.graphFailures++;
    this.lastGraphAttempt = new Date();
    console.error(`Microsoft Graph failure (${this.graphFailures}/${this.MAX_FAILURES}):`, error);
  }

  async getForumData(): Promise<ForumData> {
    if (!this.shouldTryGraph()) {
      console.log("Using mock data (Graph temporarily unavailable)");
      return this.memStorage.getForumData();
    }

    try {
      const graphService = getMicrosoftGraphService();
      const result = await graphService.getForumData();
      this.recordGraphSuccess();
      return result;
    } catch (error) {
      this.recordGraphFailure(error);
      return this.memStorage.getForumData();
    }
  }

  async getSession(id: string): Promise<Session | undefined> {
    if (!this.shouldTryGraph()) {
      return this.memStorage.getSession(id);
    }

    try {
      const graphService = getMicrosoftGraphService();
      const session = await graphService.getSession(id);
      if (session) {
        this.recordGraphSuccess();
        return session;
      }
      return this.memStorage.getSession(id);
    } catch (error) {
      this.recordGraphFailure(error);
      return this.memStorage.getSession(id);
    }
  }

  async registerForSession(sessionId: string, userEmail: string, userName?: string): Promise<Session | undefined> {
    if (!this.shouldTryGraph()) {
      console.warn("Registration using mock data - changes will not sync to Outlook calendar");
      return this.memStorage.registerForSession(sessionId, userEmail);
    }

    try {
      const graphService = getMicrosoftGraphService();
      const result = await graphService.registerForSession(sessionId, userEmail, userName || userEmail);
      if (result) {
        this.recordGraphSuccess();
        return result;
      }
      throw new Error("Registration returned no result");
    } catch (error) {
      this.recordGraphFailure(error);
      console.warn("Registration failed on Graph API, falling back to mock data");
      return this.memStorage.registerForSession(sessionId, userEmail);
    }
  }

  async unregisterFromSession(sessionId: string, userEmail: string): Promise<Session | undefined> {
    if (!this.shouldTryGraph()) {
      console.warn("Unregistration using mock data - changes will not sync to Outlook calendar");
      return this.memStorage.unregisterFromSession(sessionId, userEmail);
    }

    try {
      const graphService = getMicrosoftGraphService();
      const result = await graphService.unregisterFromSession(sessionId, userEmail);
      if (result) {
        this.recordGraphSuccess();
        return result;
      }
      throw new Error("Unregistration returned no result");
    } catch (error) {
      this.recordGraphFailure(error);
      console.warn("Unregistration failed on Graph API, falling back to mock data");
      return this.memStorage.unregisterFromSession(sessionId, userEmail);
    }
  }
}

export const storage = new GraphStorage();
