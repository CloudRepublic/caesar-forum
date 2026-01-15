import type { Session, ForumEdition, ForumData } from "@shared/schema";
import { getMicrosoftGraphService } from "./microsoft-graph";

export interface IStorage {
  getForumData(): Promise<ForumData>;
  getSession(id: string): Promise<Session | undefined>;
  getSessionBySlug(slug: string): Promise<Session | undefined>;
  registerForSession(sessionId: string, userEmail: string, userName?: string): Promise<Session | undefined>;
  unregisterFromSession(sessionId: string, userEmail: string): Promise<Session | undefined>;
  getUserPhoto(email: string): Promise<Buffer | null>;
  getUserInfo(email: string): Promise<{ displayName: string; email: string } | null>;
}

export class GraphApiUnavailableError extends Error {
  constructor(message: string = "De verbinding met Microsoft Outlook is tijdelijk niet beschikbaar. Probeer het later opnieuw.") {
    super(message);
    this.name = "GraphApiUnavailableError";
  }
}

export class GraphStorage implements IStorage {
  private graphFailures: number = 0;
  private lastGraphAttempt: Date | null = null;
  private readonly MAX_FAILURES = 3;
  private readonly RETRY_DELAY_MS = 60000;

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
      console.log("Graph API temporarily unavailable after repeated failures");
      throw new GraphApiUnavailableError();
    }

    try {
      const graphService = getMicrosoftGraphService();
      const result = await graphService.getForumData();
      this.recordGraphSuccess();
      return result;
    } catch (error) {
      this.recordGraphFailure(error);
      throw new GraphApiUnavailableError();
    }
  }

  async getSession(id: string): Promise<Session | undefined> {
    if (!this.shouldTryGraph()) {
      throw new GraphApiUnavailableError();
    }

    try {
      const graphService = getMicrosoftGraphService();
      const session = await graphService.getSession(id);
      if (session) {
        this.recordGraphSuccess();
        return session;
      }
      return undefined;
    } catch (error) {
      this.recordGraphFailure(error);
      throw new GraphApiUnavailableError();
    }
  }

  async getSessionBySlug(slug: string): Promise<Session | undefined> {
    const forumData = await this.getForumData();
    const session = forumData.sessions.find((s) => s.slug === slug);
    return session;
  }

  async registerForSession(sessionId: string, userEmail: string, userName?: string): Promise<Session | undefined> {
    if (!this.shouldTryGraph()) {
      throw new GraphApiUnavailableError("Inschrijven is tijdelijk niet mogelijk. De verbinding met Microsoft Outlook is niet beschikbaar.");
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
      throw new GraphApiUnavailableError("Inschrijven is tijdelijk niet mogelijk. De verbinding met Microsoft Outlook is niet beschikbaar.");
    }
  }

  async unregisterFromSession(sessionId: string, userEmail: string): Promise<Session | undefined> {
    if (!this.shouldTryGraph()) {
      throw new GraphApiUnavailableError("Uitschrijven is tijdelijk niet mogelijk. De verbinding met Microsoft Outlook is niet beschikbaar.");
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
      throw new GraphApiUnavailableError("Uitschrijven is tijdelijk niet mogelijk. De verbinding met Microsoft Outlook is niet beschikbaar.");
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

  async getUserInfo(email: string): Promise<{ displayName: string; email: string } | null> {
    try {
      const graphService = getMicrosoftGraphService();
      return await graphService.getUserInfo(email);
    } catch {
      return { displayName: email.split("@")[0], email };
    }
  }
}

export const storage = new GraphStorage();
