import type { Session, ForumEdition, ForumData, DietaryPreference } from "@shared/schema";
import { getMicrosoftGraphService, type PastEdition, type FeedbackEmailData } from "./microsoft-graph";
import { db } from "./db";
import { dietaryPreferences } from "./db/schema";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  getForumData(): Promise<ForumData>;
  getSession(id: string): Promise<Session | undefined>;
  getSessionBySlug(slug: string): Promise<Session | undefined>;
  registerForSession(sessionId: string, userEmail: string, userName?: string): Promise<Session | undefined>;
  unregisterFromSession(sessionId: string, userEmail: string): Promise<Session | undefined>;
  getUserPhoto(email: string): Promise<Buffer | null>;
  getUserInfo(email: string): Promise<{ displayName: string; email: string } | null>;
  // Dietary preferences
  setDietaryPreference(sessionId: string, email: string, name: string, preference: string): Promise<void>;
  getDietaryPreference(sessionId: string, email: string): Promise<DietaryPreference | undefined>;
  getDietaryPreferencesForSession(sessionId: string): Promise<DietaryPreference[]>;
  getAllDietaryPreferences(): Promise<Map<string, DietaryPreference[]>>;
  // Past editions
  getPastEditions(): Promise<PastEdition[]>;
  getEditionByDate(dateStr: string): Promise<ForumData>;
  // Feedback
  sendFeedbackEmail(speakerEmails: string[], data: FeedbackEmailData): Promise<void>;
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

  async setDietaryPreference(sessionId: string, email: string, name: string, preference: string): Promise<void> {
    const normalizedEmail = email.toLowerCase();
    const trimmedPreference = preference.trim();
    
    const existing = await db.select()
      .from(dietaryPreferences)
      .where(and(
        eq(dietaryPreferences.sessionId, sessionId),
        eq(dietaryPreferences.email, normalizedEmail)
      ))
      .limit(1);

    if (trimmedPreference === "") {
      if (existing.length > 0) {
        await db.delete(dietaryPreferences)
          .where(and(
            eq(dietaryPreferences.sessionId, sessionId),
            eq(dietaryPreferences.email, normalizedEmail)
          ));
      }
    } else if (existing.length > 0) {
      await db.update(dietaryPreferences)
        .set({ name, preference: trimmedPreference, submittedAt: new Date() })
        .where(and(
          eq(dietaryPreferences.sessionId, sessionId),
          eq(dietaryPreferences.email, normalizedEmail)
        ));
    } else {
      await db.insert(dietaryPreferences)
        .values({ sessionId, email: normalizedEmail, name, preference: trimmedPreference });
    }
  }

  async getDietaryPreference(sessionId: string, email: string): Promise<DietaryPreference | undefined> {
    const normalizedEmail = email.toLowerCase();
    const rows = await db.select()
      .from(dietaryPreferences)
      .where(and(
        eq(dietaryPreferences.sessionId, sessionId),
        eq(dietaryPreferences.email, normalizedEmail)
      ))
      .limit(1);
    
    if (rows.length === 0) return undefined;
    const row = rows[0];
    return {
      email: row.email,
      name: row.name,
      preference: row.preference,
      submittedAt: row.submittedAt.toISOString(),
    };
  }

  async getDietaryPreferencesForSession(sessionId: string): Promise<DietaryPreference[]> {
    const rows = await db.select()
      .from(dietaryPreferences)
      .where(eq(dietaryPreferences.sessionId, sessionId));
    
    return rows.map(row => ({
      email: row.email,
      name: row.name,
      preference: row.preference,
      submittedAt: row.submittedAt.toISOString(),
    }));
  }

  async getAllDietaryPreferences(): Promise<Map<string, DietaryPreference[]>> {
    const rows = await db.select().from(dietaryPreferences);
    const result = new Map<string, DietaryPreference[]>();
    
    for (const row of rows) {
      const prefs = result.get(row.sessionId) || [];
      prefs.push({
        email: row.email,
        name: row.name,
        preference: row.preference,
        submittedAt: row.submittedAt.toISOString(),
      });
      result.set(row.sessionId, prefs);
    }
    
    return result;
  }

  async getPastEditions(): Promise<PastEdition[]> {
    if (!this.shouldTryGraph()) {
      throw new GraphApiUnavailableError();
    }
    try {
      const graphService = getMicrosoftGraphService();
      const result = await graphService.getPastEditions();
      this.recordGraphSuccess();
      return result;
    } catch (error) {
      this.recordGraphFailure(error);
      throw new GraphApiUnavailableError();
    }
  }

  async getEditionByDate(dateStr: string): Promise<ForumData> {
    if (!this.shouldTryGraph()) {
      throw new GraphApiUnavailableError();
    }
    try {
      const graphService = getMicrosoftGraphService();
      const result = await graphService.getEditionByDate(dateStr);
      this.recordGraphSuccess();
      return result;
    } catch (error) {
      this.recordGraphFailure(error);
      throw new GraphApiUnavailableError();
    }
  }

  async sendFeedbackEmail(speakerEmails: string[], data: FeedbackEmailData): Promise<void> {
    if (!this.shouldTryGraph()) {
      throw new GraphApiUnavailableError();
    }
    try {
      const graphService = getMicrosoftGraphService();
      await graphService.sendFeedbackEmail(speakerEmails, data);
      this.recordGraphSuccess();
    } catch (error) {
      this.recordGraphFailure(error);
      throw new GraphApiUnavailableError();
    }
  }
}

export const storage = new GraphStorage();
