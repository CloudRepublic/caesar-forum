import type { Session, ForumEdition, ForumData } from "@shared/schema";

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
    description: "Ontdek hoe AI de manier waarop we IT-diensten leveren fundamenteel verandert. Van automatisering tot intelligente assistentie, we bespreken de mogelijkheden en uitdagingen.",
    type: "talk",
    startTime: "2026-02-20T14:00:00",
    endTime: "2026-02-20T14:45:00",
    room: "Zaal Amsterdam",
    speakerName: "Emma van den Berg",
    speakerEmail: "emma.vandenberg@caesar.nl",
    attendees: ["jan.devries@caesar.nl", "lisa.bakker@caesar.nl"],
  },
  {
    id: "session-2",
    title: "Workshop: Cloud Architecture Best Practices",
    description: "Hands-on workshop waarin we moderne cloud architectuur patronen verkennen. Breng je laptop mee voor praktische oefeningen met Azure.",
    type: "workshop",
    startTime: "2026-02-20T15:00:00",
    endTime: "2026-02-20T16:30:00",
    room: "Zaal Rotterdam",
    speakerName: "Thomas Jansen",
    speakerEmail: "thomas.jansen@caesar.nl",
    attendees: ["peter.smit@caesar.nl"],
  },
  {
    id: "session-3",
    title: "De toekomst van Yivi en digitale identiteit",
    description: "Een deep dive in Yivi, onze digitale identiteitsoplossing. Hoe past dit in de bredere Europese context van eIDAS en digitale wallets?",
    type: "talk",
    startTime: "2026-02-20T14:00:00",
    endTime: "2026-02-20T14:45:00",
    room: "Zaal Den Haag",
    speakerName: "Dibran Mulder",
    speakerEmail: "dibran.mulder@caesar.nl",
    attendees: ["anna.visser@caesar.nl", "mark.de.jong@caesar.nl", "sophie.mulder@caesar.nl"],
  },
  {
    id: "session-4",
    title: "Discussie: Remote werken na 2025",
    description: "Een open discussie over de toekomst van thuiswerken en hybride werken binnen Caesar. Deel je ervaringen en ideeën voor de ideale werkplek.",
    type: "discussie",
    startTime: "2026-02-20T15:00:00",
    endTime: "2026-02-20T15:45:00",
    room: "Zaal Amsterdam",
    speakerName: "Kiki van Dijk",
    speakerEmail: "kiki.vandijk@caesar.nl",
    attendees: [],
  },
  {
    id: "session-5",
    title: "Low-code ontwikkeling met Power Platform",
    description: "Leer hoe je snel business applicaties bouwt met Microsoft Power Platform. Geschikt voor zowel developers als business gebruikers.",
    type: "workshop",
    startTime: "2026-02-20T16:00:00",
    endTime: "2026-02-20T17:30:00",
    room: "Zaal Eindhoven",
    speakerName: "Martijn de Groot",
    speakerEmail: "martijn.degroot@caesar.nl",
    attendees: ["jan.devries@caesar.nl"],
  },
  {
    id: "session-6",
    title: "Security awareness: bescherm je digitale identiteit",
    description: "Praktische tips en trucs om jezelf en je collega's te beschermen tegen cyberdreigingen. Van phishing tot wachtwoordbeheer.",
    type: "talk",
    startTime: "2026-02-20T16:45:00",
    endTime: "2026-02-20T17:30:00",
    room: "Zaal Amsterdam",
    speakerName: "Roos Hendriks",
    speakerEmail: "roos.hendriks@caesar.nl",
    attendees: ["anna.visser@caesar.nl", "peter.smit@caesar.nl"],
  },
];

export interface IStorage {
  getForumData(): Promise<ForumData>;
  getSession(id: string): Promise<Session | undefined>;
  registerForSession(sessionId: string, userEmail: string): Promise<Session | undefined>;
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

export const storage = new MemStorage();
