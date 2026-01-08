import { ConfidentialClientApplication } from "@azure/msal-node";
import { Client } from "@microsoft/microsoft-graph-client";
import type { Session, ForumEdition, ForumData } from "@shared/schema";

const FORUM_MAILBOX = "forum@caesar.nl";

interface CalendarEvent {
  id: string;
  subject: string;
  body?: { content: string; contentType: string };
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  location?: { displayName: string };
  organizer?: { emailAddress: { name: string; address: string } };
  categories?: string[];
  attendees?: Array<{
    emailAddress: { name: string; address: string };
    type: string;
    status: { response: string };
  }>;
}

interface OutlookCategory {
  id: string;
  displayName: string;
  color: string;
}

function getCategories(categories: string[] | undefined): string[] {
  if (!categories || categories.length === 0) return [];
  return categories;
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractSpeakerPhoto(body: string | undefined): string | undefined {
  if (!body) return undefined;
  const imgMatch = body.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (!imgMatch) return undefined;
  const url = imgMatch[1];
  if (url.startsWith("cid:") || url.startsWith("data:")) return undefined;
  return url;
}

export class MicrosoftGraphService {
  private msalClient: ConfidentialClientApplication;
  private graphClient: Client | null = null;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private cachedCategories: OutlookCategory[] | null = null;
  private categoriesCacheExpiry: Date | null = null;
  private readonly CATEGORIES_CACHE_MS = 3600000; // 1 hour

  constructor() {
    const clientId = process.env.AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;
    const tenantId = process.env.AZURE_TENANT_ID;

    if (!clientId || !clientSecret || !tenantId) {
      throw new Error("Missing Azure credentials. Please set AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, and AZURE_TENANT_ID environment variables.");
    }

    this.msalClient = new ConfidentialClientApplication({
      auth: {
        clientId,
        clientSecret,
        authority: `https://login.microsoftonline.com/${tenantId}`,
      },
    });
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    const result = await this.msalClient.acquireTokenByClientCredential({
      scopes: ["https://graph.microsoft.com/.default"],
    });

    if (!result || !result.accessToken) {
      throw new Error("Failed to acquire access token from Microsoft identity platform");
    }

    this.accessToken = result.accessToken;
    this.tokenExpiry = result.expiresOn || new Date(Date.now() + 3600 * 1000);
    return this.accessToken;
  }

  private async getClient(): Promise<Client> {
    if (this.graphClient) {
      return this.graphClient;
    }

    this.graphClient = Client.init({
      authProvider: async (done) => {
        try {
          const token = await this.getAccessToken();
          done(null, token);
        } catch (error) {
          done(error as Error, null);
        }
      },
    });

    return this.graphClient;
  }

  async getCalendarEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    const client = await this.getClient();

    const response = await client
      .api(`/users/${FORUM_MAILBOX}/calendar/events`)
      .select("id,subject,body,start,end,location,organizer,categories,attendees")
      .filter(`start/dateTime ge '${startDate.toISOString()}' and start/dateTime le '${endDate.toISOString()}'`)
      .orderby("start/dateTime")
      .top(100)
      .get();

    return response.value as CalendarEvent[];
  }

  async getMasterCategories(): Promise<OutlookCategory[]> {
    if (this.cachedCategories && this.categoriesCacheExpiry && this.categoriesCacheExpiry > new Date()) {
      return this.cachedCategories;
    }

    try {
      const client = await this.getClient();
      const response = await client
        .api(`/users/${FORUM_MAILBOX}/outlook/masterCategories`)
        .get();
      this.cachedCategories = response.value as OutlookCategory[];
      this.categoriesCacheExpiry = new Date(Date.now() + this.CATEGORIES_CACHE_MS);
      console.log("Fetched master categories:", this.cachedCategories.map(c => c.displayName));
      return this.cachedCategories;
    } catch (error) {
      console.error("Failed to fetch master categories:", error);
      return [];
    }
  }

  private isAllDayEvent(event: CalendarEvent): boolean {
    const start = new Date(event.start.dateTime);
    const end = new Date(event.end.dateTime);
    const durationMs = end.getTime() - start.getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    const startsAtMidnight = start.getHours() === 0 && start.getMinutes() === 0;
    const isFullDay = durationMs >= oneDayMs;
    
    return startsAtMidnight && isFullDay;
  }

  async getForumData(): Promise<ForumData> {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 3, 0);

    const [events, masterCategories] = await Promise.all([
      this.getCalendarEvents(startDate, endDate),
      this.getMasterCategories(),
    ]);

    const allDayEvent = events.find((e) => this.isAllDayEvent(e));
    const sessionEvents = events.filter((e) => !this.isAllDayEvent(e));

    if (sessionEvents.length === 0 && !allDayEvent) {
      return {
        edition: {
          id: "no-events",
          title: "Geen aankomende sessies",
          date: now.toISOString().split("T")[0],
          location: "Caesar Hoofdkantoor, Utrecht",
        },
        sessions: [],
      };
    }

    const forumDate = allDayEvent 
      ? new Date(allDayEvent.start.dateTime)
      : sessionEvents.length > 0 
        ? new Date(sessionEvents[0].start.dateTime)
        : now;

    const monthNames = [
      "Januari", "Februari", "Maart", "April", "Mei", "Juni",
      "Juli", "Augustus", "September", "Oktober", "November", "December"
    ];

    const edition: ForumEdition = {
      id: `edition-${forumDate.getFullYear()}-${String(forumDate.getMonth() + 1).padStart(2, "0")}`,
      title: `Caesar Forum - ${monthNames[forumDate.getMonth()]} ${forumDate.getFullYear()}`,
      date: forumDate.toISOString().split("T")[0],
      location: allDayEvent?.location?.displayName || "Caesar Hoofdkantoor, Utrecht",
    };

    const sessions: Session[] = sessionEvents.map((event) => {
      const bodyContent = event.body?.content || "";
      const description = event.body?.contentType === "html" 
        ? stripHtml(bodyContent) 
        : bodyContent;
      
      const humanAttendees = (event.attendees || [])
        .filter((a) => a.type.toLowerCase() !== "resource");
      
      const requiredAttendee = humanAttendees.find((a) => a.type.toLowerCase() === "required");
      
      const acceptedAttendees = humanAttendees
        .filter((a) => a.status.response === "accepted" || a.status.response === "tentativelyAccepted")
        .map((a) => a.emailAddress.address);

      const speakerName = requiredAttendee?.emailAddress.name || 
                          event.organizer?.emailAddress.name || 
                          "Onbekende spreker";
      const speakerEmail = requiredAttendee?.emailAddress.address || 
                           event.organizer?.emailAddress.address || 
                           "";

      return {
        id: event.id,
        title: event.subject,
        description: description || "Geen beschrijving beschikbaar.",
        categories: getCategories(event.categories),
        startTime: event.start.dateTime,
        endTime: event.end.dateTime,
        room: event.location?.displayName || "Zaal nog te bepalen",
        speakerName,
        speakerEmail,
        speakerPhotoUrl: extractSpeakerPhoto(bodyContent),
        attendees: acceptedAttendees,
      };
    });

    return { edition, sessions };
  }

  async getSession(id: string): Promise<Session | undefined> {
    try {
      const client = await this.getClient();
      
      const event = await client
        .api(`/users/${FORUM_MAILBOX}/calendar/events/${id}`)
        .select("id,subject,body,start,end,location,organizer,categories,attendees")
        .get() as CalendarEvent;

      const bodyContent = event.body?.content || "";
      const description = event.body?.contentType === "html" 
        ? stripHtml(bodyContent) 
        : bodyContent;

      const humanAttendees = (event.attendees || [])
        .filter((a) => a.type.toLowerCase() !== "resource");
      
      const requiredAttendee = humanAttendees.find((a) => a.type.toLowerCase() === "required");
      
      const acceptedAttendees = humanAttendees
        .filter((a) => a.status.response === "accepted" || a.status.response === "tentativelyAccepted")
        .map((a) => a.emailAddress.address);

      const speakerName = requiredAttendee?.emailAddress.name || 
                          event.organizer?.emailAddress.name || 
                          "Onbekende spreker";
      const speakerEmail = requiredAttendee?.emailAddress.address || 
                           event.organizer?.emailAddress.address || 
                           "";

      return {
        id: event.id,
        title: event.subject,
        description: description || "Geen beschrijving beschikbaar.",
        categories: getCategories(event.categories),
        startTime: event.start.dateTime,
        endTime: event.end.dateTime,
        room: event.location?.displayName || "Zaal nog te bepalen",
        speakerName,
        speakerEmail,
        speakerPhotoUrl: extractSpeakerPhoto(bodyContent),
        attendees: acceptedAttendees,
      };
    } catch {
      return undefined;
    }
  }

  async registerForSession(sessionId: string, userEmail: string, userName: string): Promise<Session | undefined> {
    try {
      const client = await this.getClient();

      const event = await client
        .api(`/users/${FORUM_MAILBOX}/calendar/events/${sessionId}`)
        .select("attendees")
        .get() as CalendarEvent;

      const existingAttendees = event.attendees || [];
      const alreadyRegistered = existingAttendees.some(
        (a) => a.emailAddress.address.toLowerCase() === userEmail.toLowerCase()
      );

      if (!alreadyRegistered) {
        const updatedAttendees = [
          ...existingAttendees,
          {
            emailAddress: { address: userEmail, name: userName },
            type: "required",
          },
        ];

        await client
          .api(`/users/${FORUM_MAILBOX}/calendar/events/${sessionId}`)
          .patch({ attendees: updatedAttendees });
      }

      return this.getSession(sessionId);
    } catch {
      return undefined;
    }
  }

  async unregisterFromSession(sessionId: string, userEmail: string): Promise<Session | undefined> {
    try {
      const client = await this.getClient();

      const event = await client
        .api(`/users/${FORUM_MAILBOX}/calendar/events/${sessionId}`)
        .select("attendees")
        .get() as CalendarEvent;

      const existingAttendees = event.attendees || [];
      const updatedAttendees = existingAttendees.filter(
        (a) => a.emailAddress.address.toLowerCase() !== userEmail.toLowerCase()
      );

      await client
        .api(`/users/${FORUM_MAILBOX}/calendar/events/${sessionId}`)
        .patch({ attendees: updatedAttendees });

      return this.getSession(sessionId);
    } catch {
      return undefined;
    }
  }
}

let graphService: MicrosoftGraphService | null = null;

export function getMicrosoftGraphService(): MicrosoftGraphService {
  if (!graphService) {
    graphService = new MicrosoftGraphService();
  }
  return graphService;
}
