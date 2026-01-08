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
    slug: "introductie-tot-ai-in-it-dienstverlening-abc123",
    title: "Introductie tot AI in IT-dienstverlening",
    description: "Ontdek hoe AI de manier waarop we IT-diensten leveren fundamenteel verandert.",
    categories: ["Talk"],
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
    slug: "workshop-cloud-architecture-best-practices-def456",
    title: "Workshop: Cloud Architecture Best Practices",
    description: "Hands-on workshop waarin we moderne cloud architectuur patronen verkennen.",
    categories: ["Workshop"],
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
    slug: "de-toekomst-van-yivi-en-digitale-identiteit-ghi789",
    title: "De toekomst van Yivi en digitale identiteit",
    description: "Een deep dive in Yivi, onze digitale identiteitsoplossing.",
    categories: ["Talk", "Demo"],
    startTime: "2026-02-20T14:00:00",
    endTime: "2026-02-20T14:45:00",
    room: "Zaal Den Haag",
    speakerName: "Dibran Mulder",
    speakerEmail: "dibran.mulder@caesar.nl",
    speakerPhotoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    attendees: ["anna.visser@caesar.nl", "mark.de.jong@caesar.nl"],
  },
];

export interface IStorage {
  getForumData(): Promise<ForumData>;
  getSession(id: string): Promise<Session | undefined>;
  getSessionBySlug(slug: string): Promise<Session | undefined>;
  registerForSession(sessionId: string, userEmail: string, userName?: string): Promise<Session | undefined>;
  unregisterFromSession(sessionId: string, userEmail: string): Promise<Session | undefined>;
  getUserPhoto(email: string): Promise<Buffer | null>;
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

  async getSessionBySlug(slug: string): Promise<Session | undefined> {
    return Array.from(this.sessions.values()).find((s) => s.slug === slug);
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

  async getUserPhoto(_email: string): Promise<Buffer | null> {
    return null;
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

  async getSessionBySlug(slug: string): Promise<Session | undefined> {
    // Get all forum data and find session by slug
    const forumData = await this.getForumData();
    const session = forumData.sessions.find((s) => s.slug === slug);
    if (session) {
      return session;
    }
    return this.memStorage.getSessionBySlug(slug);
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

  async getUserPhoto(email: string): Promise<Buffer | null> {
    try {
      const graphService = getMicrosoftGraphService();
      return await graphService.getUserPhoto(email);
    } catch {
      return null;
    }
  }
}

export const storage = new GraphStorage();
