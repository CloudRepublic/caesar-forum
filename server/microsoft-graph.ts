import { ConfidentialClientApplication } from "@azure/msal-node";
import { Client } from "@microsoft/microsoft-graph-client";
import DOMPurify from "isomorphic-dompurify";
import type { Session, ForumEdition, ForumData } from "@shared/schema";

// Extract local part from email (before @) for alias comparison
function getEmailLocalPart(email: string): string {
  return email.split("@")[0].toLowerCase();
}

// Check if two emails have the same local part (handles multi-domain aliases)
function emailsMatch(email1: string, email2: string): boolean {
  return getEmailLocalPart(email1) === getEmailLocalPart(email2);
}

// Convert "Last, First" format to "First Last" format
function formatDisplayName(name: string): string {
  if (!name) return name;
  // Check if name contains a comma (indicates "Last, First" format)
  if (name.includes(",")) {
    const parts = name.split(",").map(p => p.trim());
    if (parts.length === 2 && parts[0] && parts[1]) {
      return `${parts[1]} ${parts[0]}`;
    }
  }
  return name;
}

// Sanitize HTML while removing inline styles and font tags, convert divs to paragraphs
function sanitizeHtml(html: string): string {
  let sanitized = DOMPurify.sanitize(html, {
    FORBID_TAGS: ["style", "font"],
    FORBID_ATTR: ["style", "class", "face", "size", "color"],
  });
  // Convert div tags to p tags for proper paragraph spacing
  sanitized = sanitized.replace(/<div>/gi, "<p>").replace(/<\/div>/gi, "</p>");
  return sanitized;
}

// Parse back-matter metadata from description (YAML-style block at end)
// Format: ---\nkey: value\nkey2: value2\n---
// Flexible to handle Outlook's HTML structure where each line becomes a paragraph
interface BackMatter {
  metadata: Record<string, string>;
  content: string;
}

function parseBackMatter(text: string): BackMatter {
  // Normalize text: collapse multiple newlines/whitespace to single newlines
  const normalizedText = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n\s*\n/g, "\n")
    .trim();
  
  // Match a YAML-style block at the end: ---\n...\n---
  // Allow for flexible whitespace and empty lines between elements
  const backMatterRegex = /[\n\s]*---[\n\s]+([\s\S]*?)[\n\s]+---[\n\s]*$/;
  const match = normalizedText.match(backMatterRegex);
  
  if (!match) {
    return { metadata: {}, content: text };
  }
  
  const metadata: Record<string, string> = {};
  const yamlContent = match[1];
  
  // Parse simple key: value pairs
  const lines = yamlContent.split(/[\n]+/);
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    const colonIndex = trimmedLine.indexOf(":");
    if (colonIndex > 0) {
      const key = trimmedLine.substring(0, colonIndex).trim().toLowerCase();
      const value = trimmedLine.substring(colonIndex + 1).trim();
      if (key && value) {
        metadata[key] = value;
      }
    }
  }
  
  // Only return metadata if we found valid key-value pairs
  if (Object.keys(metadata).length === 0) {
    return { metadata: {}, content: text };
  }
  
  // Remove the back-matter block from content using the same regex on normalized text
  // Then clean up excessive whitespace
  let content = normalizedText.replace(backMatterRegex, "").trim();
  
  // Clean up excessive whitespace that might remain
  content = content
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")  // Max 2 consecutive newlines
    .trim();
  
  return { metadata, content };
}

// Strip back-matter from HTML content (for display)
function stripBackMatterFromHtml(html: string): string {
  // First convert to plain text to check if back-matter exists
  const textContent = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(p|div)[^>]*>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/\n\s*\n/g, "\n");
  
  const { metadata } = parseBackMatter(textContent);
  
  if (Object.keys(metadata).length === 0) {
    return html;
  }
  
  // Remove the back-matter block from HTML
  // Handle various Outlook patterns including those with newlines inside tags
  let result = html;
  
  // Pattern: Find --- followed by key:value pairs followed by --- (with any HTML/whitespace between)
  // This is a more aggressive pattern that handles Outlook's various formatting quirks
  const generalPattern = /<(p|div|span)[^>]*>[\s\n]*---[\s\S]*?---[\s\n]*(<br\s*\/?>)?[\s\n]*<\/(p|div|span)>/gi;
  result = result.replace(generalPattern, "");
  
  // Pattern for back-matter spread across multiple block elements
  // Match from first --- block to last --- block including everything between
  const multiBlockPattern = /<(p|div)[^>]*>[\s\n]*---[\s\n]*<\/(p|div)>[\s\S]*?<(p|div)[^>]*>[\s\n]*---[\s\n]*(<br\s*\/?>)?[\s\n]*<\/(p|div)>/gi;
  result = result.replace(multiBlockPattern, "");
  
  // Clean up empty paragraphs and trailing whitespace elements
  result = result.replace(/<(p|div|span)[^>]*>[\s\n]*(<br\s*\/?>)?[\s\n]*<\/(p|div|span)>\s*$/gi, "");
  result = result.replace(/<(p|div|span)[^>]*>[\s\n]*(<br\s*\/?>)?[\s\n]*<\/(p|div|span)>\s*(<span><\/span>)?\s*$/gi, "");
  
  // Remove trailing empty spans
  result = result.replace(/\s*<span>\s*<\/span>\s*$/gi, "");
  
  // Remove leading empty spans
  result = result.replace(/^\s*<span>\s*<\/span>\s*/gi, "");
  
  // Clean up multiple trailing empty paragraphs
  while (/<(p|div)[^>]*>\s*(<br\s*\/?>)?\s*<\/(p|div)>\s*$/i.test(result)) {
    result = result.replace(/<(p|div)[^>]*>\s*(<br\s*\/?>)?\s*<\/(p|div)>\s*$/i, "");
  }
  
  // Remove trailing <br> tags
  result = result.replace(/(<br\s*\/?>[\s\n]*)+$/gi, "");
  
  // Remove trailing </p> with only <br> before it
  result = result.replace(/<br\s*\/?>\s*\n*<\/p>\s*$/gi, "</p>");
  
  // Remove empty paragraphs that only contain <br> (these create excessive whitespace)
  result = result.replace(/<p[^>]*>[\s\n]*<br\s*\/?>[\s\n]*<\/p>/gi, "");
  
  return result.trim();
}

// Generate URL-friendly slug from title with short hash suffix for uniqueness
function generateSlug(title: string, graphId: string): string {
  // Create slug from title
  const titleSlug = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Spaces to hyphens
    .replace(/-+/g, "-") // Multiple hyphens to single
    .replace(/^-|-$/g, "") // Trim hyphens
    .substring(0, 50); // Limit length
  
  // Create short hash from Graph ID for uniqueness (always 6 chars)
  let hash = 0;
  for (let i = 0; i < graphId.length; i++) {
    hash = ((hash << 5) - hash) + graphId.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  const hashSuffix = Math.abs(hash).toString(36).padStart(6, "0").substring(0, 6);
  
  return `${titleSlug}-${hashSuffix}`;
}

const FORUM_MAILBOX = "forum@caesar.nl";

// Logging utilities
function logApiRequest(method: string, endpoint: string, context?: string) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [API REQUEST] ${method} ${endpoint}${context ? ` (${context})` : ""}`);
}

function logApiResponse(method: string, endpoint: string, status: number | string, durationMs: number) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [API RESPONSE] ${method} ${endpoint} - Status: ${status} - Duration: ${durationMs}ms`);
}

function logApiError(method: string, endpoint: string, error: unknown, durationMs?: number, context?: string) {
  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.message : String(error);
  const statusCode = (error as any)?.statusCode || (error as any)?.code || "UNKNOWN";
  const durationStr = durationMs !== undefined ? ` - Duration: ${durationMs}ms` : "";
  console.error(`[${timestamp}] [API ERROR] ${method} ${endpoint} - Status: ${statusCode}${durationStr} - Error: ${errorMessage}${context ? ` - Context: ${context}` : ""}`);
}

function logAuthFailure(reason: string, details?: string) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [AUTH FAILURE] ${reason}${details ? ` - ${details}` : ""}`);
}

function logThrottling(endpoint: string, retryAfterMs: number, attempt: number) {
  const timestamp = new Date().toISOString();
  console.warn(`[${timestamp}] [THROTTLING] ${endpoint} - Retry after ${retryAfterMs}ms - Attempt ${attempt}`);
}

// Retry configuration
interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
};

// Calculate exponential backoff delay
function calculateBackoffDelay(attempt: number, config: RetryConfig): number {
  const delay = Math.min(
    config.baseDelayMs * Math.pow(2, attempt),
    config.maxDelayMs
  );
  // Add jitter (10-20% randomness)
  const jitter = delay * (0.1 + Math.random() * 0.1);
  return Math.floor(delay + jitter);
}

// Sleep utility
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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


export class MicrosoftGraphService {
  private msalClient: ConfidentialClientApplication;
  private graphClient: Client | null = null;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private cachedCategories: OutlookCategory[] | null = null;
  private categoriesCacheExpiry: Date | null = null;
  private readonly CATEGORIES_CACHE_MS = 3600000; // 1 hour
  private readonly retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG;

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

    logApiRequest("POST", "https://login.microsoftonline.com/.../token", "Token acquisition");
    const startTime = Date.now();

    try {
      const result = await this.msalClient.acquireTokenByClientCredential({
        scopes: ["https://graph.microsoft.com/.default"],
      });

      if (!result || !result.accessToken) {
        logAuthFailure("Token acquisition failed", "No access token in response");
        throw new Error("Failed to acquire access token from Microsoft identity platform");
      }

      this.accessToken = result.accessToken;
      this.tokenExpiry = result.expiresOn || new Date(Date.now() + 3600 * 1000);
      logApiResponse("POST", "token", "SUCCESS", Date.now() - startTime);
      return this.accessToken;
    } catch (error) {
      logAuthFailure("Token acquisition error", error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  private invalidateToken(): void {
    this.accessToken = null;
    this.tokenExpiry = null;
    this.graphClient = null;
    console.log(`[${new Date().toISOString()}] [TOKEN] Token invalidated for refresh`);
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

  // Execute Graph API call with retry and error handling
  private async executeWithRetry<T>(
    method: string,
    endpoint: string,
    operation: () => Promise<T>,
    context?: string
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      const startTime = Date.now();
      logApiRequest(method, endpoint, context);

      try {
        const result = await operation();
        logApiResponse(method, endpoint, "SUCCESS", Date.now() - startTime);
        return result;
      } catch (error: unknown) {
        lastError = error;
        const statusCode = (error as any)?.statusCode || (error as any)?.code;
        const durationMs = Date.now() - startTime;

        // Handle specific error codes
        if (statusCode === 401) {
          logAuthFailure("401 Unauthorized", endpoint);
          // Invalidate token and retry with fresh token
          this.invalidateToken();
          if (attempt < this.retryConfig.maxRetries) {
            const delay = calculateBackoffDelay(attempt, this.retryConfig);
            console.log(`[${new Date().toISOString()}] [RETRY] Attempt ${attempt + 1}/${this.retryConfig.maxRetries} after 401 - waiting ${delay}ms`);
            await sleep(delay);
            continue;
          }
        }

        if (statusCode === 403) {
          logApiError(method, endpoint, error, durationMs, "403 Forbidden - Access denied to mailbox or resource");
          // Don't retry 403 - it's a permission issue
          throw new Error(`Access denied to ${endpoint}. Check mailbox permissions and application consent.`);
        }

        if (statusCode === 404) {
          logApiError(method, endpoint, error, durationMs, "404 Not Found - Resource does not exist");
          // Don't retry 404 - resource doesn't exist, retrying won't help
          throw new Error(`Resource not found: ${endpoint}`);
        }

        if (statusCode === 429) {
          // Get Retry-After header if available
          const retryAfterHeader = (error as any)?.headers?.get?.("Retry-After");
          const retryAfterMs = retryAfterHeader 
            ? parseInt(retryAfterHeader, 10) * 1000 
            : calculateBackoffDelay(attempt, this.retryConfig);
          
          logThrottling(endpoint, retryAfterMs, attempt + 1);
          
          if (attempt < this.retryConfig.maxRetries) {
            await sleep(retryAfterMs);
            continue;
          }
        }

        // For other errors, use exponential backoff
        logApiError(method, endpoint, error, durationMs, `Attempt ${attempt + 1}`);
        
        if (attempt < this.retryConfig.maxRetries) {
          const delay = calculateBackoffDelay(attempt, this.retryConfig);
          console.log(`[${new Date().toISOString()}] [RETRY] Attempt ${attempt + 1}/${this.retryConfig.maxRetries} - waiting ${delay}ms`);
          await sleep(delay);
        }
      }
    }

    // All retries exhausted
    const errorMessage = lastError instanceof Error ? lastError.message : String(lastError);
    throw new Error(`Failed after ${this.retryConfig.maxRetries + 1} attempts: ${errorMessage}`);
  }

  async getCalendarEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    const endpoint = `/users/${FORUM_MAILBOX}/calendar/events`;
    
    return this.executeWithRetry("GET", endpoint, async () => {
      const client = await this.getClient();
      const response = await client
        .api(endpoint)
        .header("Prefer", 'outlook.timezone="Europe/Amsterdam"')
        .select("id,subject,body,start,end,location,organizer,categories,attendees")
        .filter(`start/dateTime ge '${startDate.toISOString()}' and start/dateTime le '${endDate.toISOString()}'`)
        .orderby("start/dateTime")
        .top(100)
        .get();
      return response.value as CalendarEvent[];
    }, `Date range: ${startDate.toISOString().split("T")[0]} to ${endDate.toISOString().split("T")[0]}`);
  }

  async getMasterCategories(): Promise<OutlookCategory[]> {
    if (this.cachedCategories && this.categoriesCacheExpiry && this.categoriesCacheExpiry > new Date()) {
      return this.cachedCategories;
    }

    const endpoint = `/users/${FORUM_MAILBOX}/outlook/masterCategories`;
    
    try {
      const categories = await this.executeWithRetry("GET", endpoint, async () => {
        const client = await this.getClient();
        const response = await client.api(endpoint).get();
        return response.value as OutlookCategory[];
      });
      
      this.cachedCategories = categories;
      this.categoriesCacheExpiry = new Date(Date.now() + this.CATEGORIES_CACHE_MS);
      console.log(`[${new Date().toISOString()}] [CACHE] Master categories cached: ${categories.map(c => c.displayName).join(", ")}`);
      return this.cachedCategories;
    } catch (error) {
      logApiError("GET", endpoint, error, undefined, "Falling back to empty categories");
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

  private isSameDate(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  async getForumData(): Promise<ForumData> {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 3, 0);

    const [events, masterCategories] = await Promise.all([
      this.getCalendarEvents(startDate, endDate),
      this.getMasterCategories(),
    ]);

    // Find the first upcoming all-day event - this defines the Forum
    const allDayEvent = events.find((e) => this.isAllDayEvent(e));

    // No all-day event means no Forum
    if (!allDayEvent) {
      return {
        edition: {
          id: "no-events",
          title: "Geen aankomend event",
          date: now.toISOString().split("T")[0],
          location: "Caesar Hoofdkantoor, Utrecht",
        },
        sessions: [],
      };
    }

    // The forum date is determined by the all-day event
    const forumDate = new Date(allDayEvent.start.dateTime);

    // Only sessions on the same date as the all-day event count
    const sessionEvents = events.filter((e) => {
      if (this.isAllDayEvent(e)) return false;
      const eventDate = new Date(e.start.dateTime);
      return this.isSameDate(eventDate, forumDate);
    });

    const monthNames = [
      "Januari", "Februari", "Maart", "April", "Mei", "Juni",
      "Juli", "Augustus", "September", "Oktober", "November", "December"
    ];

    const sessions: Session[] = sessionEvents.map((event) => {
      const bodyContent = event.body?.content || "";
      const isHtml = event.body?.contentType === "html";
      
      // Parse back-matter metadata from plain text content
      const plainText = isHtml ? stripHtml(bodyContent) : bodyContent;
      const { metadata, content: cleanDescription } = parseBackMatter(plainText);
      
      // Use custom slug from back-matter if provided, otherwise generate
      const customSlug = metadata["slug"];
      const slug = customSlug || generateSlug(event.subject, event.id);
      
      // Parse capacity from back-matter if provided
      const capacityValue = metadata["capacity"];
      const capacity = capacityValue ? parseInt(capacityValue, 10) : undefined;
      const validCapacity = capacity && !isNaN(capacity) && capacity > 0 ? capacity : undefined;
      
      // Parse diet-form from back-matter if provided
      const dietFormValue = metadata["diet-form"];
      const showDietaryForm = dietFormValue?.toLowerCase() === "true" || dietFormValue === "1";
      
      // Strip back-matter from HTML for display
      const cleanHtml = isHtml ? stripBackMatterFromHtml(sanitizeHtml(bodyContent)) : undefined;
      
      const humanAttendees = (event.attendees || [])
        .filter((a) => a.type.toLowerCase() !== "resource");
      
      // Get all required attendees as speakers
      const requiredAttendees = humanAttendees.filter((a) => a.type.toLowerCase() === "required");
      
      // Build speakers array from required attendees only
      const speakers: { name: string; email: string; photoUrl?: string }[] = requiredAttendees.map((a) => ({
        name: formatDisplayName(a.emailAddress.name || a.emailAddress.address.split("@")[0]),
        email: a.emailAddress.address,
        photoUrl: `/api/users/${encodeURIComponent(a.emailAddress.address)}/photo`,
      }));
      
      // Include optional attendees (registered via app) who haven't declined
      // Also include anyone who explicitly accepted/tentatively accepted
      const registeredAttendees = humanAttendees
        .filter((a) => 
          (a.type.toLowerCase() === "optional" && a.status.response.toLowerCase() !== "declined") || 
          a.status.response === "accepted" || 
          a.status.response === "tentativelyAccepted"
        )
        .filter((a) => a.type.toLowerCase() !== "required")
        .map((a) => ({
          name: formatDisplayName(a.emailAddress.name || a.emailAddress.address.split("@")[0]),
          email: a.emailAddress.address,
          photoUrl: `/api/users/${encodeURIComponent(a.emailAddress.address)}/photo`,
        }));

      return {
        id: event.id,
        slug,
        title: event.subject,
        description: cleanDescription || "Geen beschrijving beschikbaar.",
        descriptionHtml: cleanHtml,
        categories: getCategories(event.categories),
        startTime: event.start.dateTime,
        endTime: event.end.dateTime,
        room: event.location?.displayName || "Zaal nog te bepalen",
        speakers,
        attendees: registeredAttendees,
        capacity: validCapacity,
        showDietaryForm: showDietaryForm || undefined,
      };
    });

    // Calculate unique speaker and attendee counts across all sessions
    const uniqueSpeakers = new Set<string>();
    const uniqueAttendees = new Set<string>();
    sessions.forEach(session => {
      session.speakers.forEach(s => uniqueSpeakers.add(s.email.toLowerCase()));
      session.attendees.forEach(a => uniqueAttendees.add(a.email.toLowerCase()));
    });

    // Use the all-day event's subject as the forum title
    const edition: ForumEdition = {
      id: `edition-${forumDate.getFullYear()}-${String(forumDate.getMonth() + 1).padStart(2, "0")}-${String(forumDate.getDate()).padStart(2, "0")}`,
      title: allDayEvent.subject,
      date: forumDate.toISOString().split("T")[0],
      location: allDayEvent.location?.displayName || "Caesar Hoofdkantoor, Utrecht",
      speakerCount: uniqueSpeakers.size,
      attendeeCount: uniqueAttendees.size,
    };

    return { edition, sessions };
  }

  async getSession(id: string): Promise<Session | undefined> {
    const endpoint = `/users/${FORUM_MAILBOX}/calendar/events/${id}`;
    
    try {
      const event = await this.executeWithRetry("GET", endpoint, async () => {
        const client = await this.getClient();
        return await client
          .api(endpoint)
          .header("Prefer", 'outlook.timezone="Europe/Amsterdam"')
          .select("id,subject,body,start,end,location,organizer,categories,attendees")
          .get() as CalendarEvent;
      }, `Session ID: ${id}`);

      const bodyContent = event.body?.content || "";
      const isHtml = event.body?.contentType === "html";
      
      // Parse back-matter metadata from plain text content
      const plainText = isHtml ? stripHtml(bodyContent) : bodyContent;
      const { metadata, content: cleanDescription } = parseBackMatter(plainText);
      
      // Use custom slug from back-matter if provided, otherwise generate
      const customSlug = metadata["slug"];
      const slug = customSlug || generateSlug(event.subject, event.id);
      
      // Parse capacity from back-matter if provided
      const capacityValue = metadata["capacity"];
      const capacity = capacityValue ? parseInt(capacityValue, 10) : undefined;
      const validCapacity = capacity && !isNaN(capacity) && capacity > 0 ? capacity : undefined;
      
      // Parse diet-form from back-matter if provided
      const dietFormValue = metadata["diet-form"];
      const showDietaryForm = dietFormValue?.toLowerCase() === "true" || dietFormValue === "1";
      
      // Strip back-matter from HTML for display
      const cleanHtml = isHtml ? stripBackMatterFromHtml(sanitizeHtml(bodyContent)) : undefined;

      const humanAttendees = (event.attendees || [])
        .filter((a) => a.type.toLowerCase() !== "resource");
      
      // Get all required attendees as speakers
      const requiredAttendees = humanAttendees.filter((a) => a.type.toLowerCase() === "required");
      
      // Build speakers array from required attendees only
      const speakers: { name: string; email: string; photoUrl?: string }[] = requiredAttendees.map((a) => ({
        name: formatDisplayName(a.emailAddress.name || a.emailAddress.address.split("@")[0]),
        email: a.emailAddress.address,
        photoUrl: `/api/users/${encodeURIComponent(a.emailAddress.address)}/photo`,
      }));
      
      // Include optional attendees (registered via app) who haven't declined
      // Also include anyone who explicitly accepted/tentatively accepted
      const registeredAttendees = humanAttendees
        .filter((a) => 
          (a.type.toLowerCase() === "optional" && a.status.response.toLowerCase() !== "declined") || 
          a.status.response === "accepted" || 
          a.status.response === "tentativelyAccepted"
        )
        .filter((a) => a.type.toLowerCase() !== "required")
        .map((a) => ({
          name: formatDisplayName(a.emailAddress.name || a.emailAddress.address.split("@")[0]),
          email: a.emailAddress.address,
          photoUrl: `/api/users/${encodeURIComponent(a.emailAddress.address)}/photo`,
        }));

      return {
        id: event.id,
        slug,
        title: event.subject,
        description: cleanDescription || "Geen beschrijving beschikbaar.",
        descriptionHtml: cleanHtml,
        categories: getCategories(event.categories),
        startTime: event.start.dateTime,
        endTime: event.end.dateTime,
        room: event.location?.displayName || "Zaal nog te bepalen",
        speakers,
        attendees: registeredAttendees,
        capacity: validCapacity,
        showDietaryForm: showDietaryForm || undefined,
      };
    } catch (error) {
      logApiError("GET", endpoint, error, undefined, `Session not found: ${id}`);
      return undefined;
    }
  }

  private normalizeEmailToCaesar(email: string): string {
    const parts = email.split("@");
    if (parts.length !== 2) return email;
    const [localPart, domain] = parts;
    // Always try caesar.nl first for any domain alias
    if (domain.toLowerCase() !== "caesar.nl") {
      return `${localPart}@caesar.nl`;
    }
    return email;
  }

  async getUserPhoto(email: string): Promise<Buffer | null> {
    // Try caesar.nl normalized email first (most users are stored with @caesar.nl)
    const caesarEmail = this.normalizeEmailToCaesar(email);
    const caesarEndpoint = `/users/${caesarEmail}/photo/$value`;
    
    try {
      return await this.executeWithRetry("GET", caesarEndpoint, async () => {
        const client = await this.getClient();
        const response = await client
          .api(caesarEndpoint)
          .responseType("arraybuffer" as any)
          .get();
        return Buffer.from(response);
      }, `User photo: ${caesarEmail}`);
    } catch {
      // If caesar.nl failed and original email is different, try original
      if (caesarEmail !== email) {
        const originalEndpoint = `/users/${email}/photo/$value`;
        try {
          return await this.executeWithRetry("GET", originalEndpoint, async () => {
            const client = await this.getClient();
            const response = await client
              .api(originalEndpoint)
              .responseType("arraybuffer" as any)
              .get();
            return Buffer.from(response);
          }, `User photo (original): ${email}`);
        } catch {
          return null;
        }
      }
      return null;
    }
  }

  async getUserInfo(email: string): Promise<{ displayName: string; email: string } | null> {
    // Try caesar.nl normalized email first (most users are stored with @caesar.nl)
    const caesarEmail = this.normalizeEmailToCaesar(email);
    const caesarEndpoint = `/users/${caesarEmail}`;
    
    try {
      return await this.executeWithRetry("GET", caesarEndpoint, async () => {
        const client = await this.getClient();
        const user = await client.api(caesarEndpoint).select("displayName,mail,userPrincipalName").get();
        return {
          displayName: formatDisplayName(user.displayName || email.split("@")[0]),
          email: user.mail || user.userPrincipalName || email,
        };
      }, `User info: ${caesarEmail}`);
    } catch {
      // If caesar.nl failed and original email is different, try original
      if (caesarEmail !== email) {
        const originalEndpoint = `/users/${email}`;
        try {
          return await this.executeWithRetry("GET", originalEndpoint, async () => {
            const client = await this.getClient();
            const user = await client.api(originalEndpoint).select("displayName,mail,userPrincipalName").get();
            return {
              displayName: formatDisplayName(user.displayName || email.split("@")[0]),
              email: user.mail || user.userPrincipalName || email,
            };
          }, `User info (original): ${email}`);
        } catch {
          return null;
        }
      }
      return null;
    }
  }

  async registerForSession(sessionId: string, userEmail: string, userName: string): Promise<Session | undefined> {
    const endpoint = `/users/${FORUM_MAILBOX}/calendar/events/${sessionId}`;
    
    try {
      // Get current attendees
      const event = await this.executeWithRetry("GET", endpoint, async () => {
        const client = await this.getClient();
        return await client.api(endpoint).select("attendees").get() as CalendarEvent;
      }, `Get attendees for registration: ${userEmail}`);

      const existingAttendees = event.attendees || [];
      const existingEntry = existingAttendees.find(
        (a) => emailsMatch(a.emailAddress.address, userEmail)
      );
      
      // Check if user already registered and not declined
      const isActivelyRegistered = existingEntry && 
        existingEntry.status.response.toLowerCase() !== "declined";

      if (!isActivelyRegistered) {
        // Remove any existing declined entry, then add fresh with explicit status
        const filteredAttendees = existingAttendees.filter(
          (a) => !emailsMatch(a.emailAddress.address, userEmail)
        );
        
        // Use the email that's already in the system if exists (to avoid duplicates)
        const existingEmail = existingEntry?.emailAddress.address;
        const emailToUse = existingEmail || userEmail;
        
        const updatedAttendees = [
          ...filteredAttendees,
          {
            emailAddress: { address: emailToUse, name: userName },
            type: "optional",
            status: {
              response: "none",
              time: new Date().toISOString()
            }
          },
        ];

        await this.executeWithRetry("PATCH", endpoint, async () => {
          const client = await this.getClient();
          return await client.api(endpoint).patch({ attendees: updatedAttendees });
        }, `Register user: ${userEmail}`);
        
        console.log(`[${new Date().toISOString()}] [REGISTRATION] User ${userEmail} registered for session ${sessionId}`);
      }

      return this.getSession(sessionId);
    } catch (error) {
      logApiError("PATCH", endpoint, error, undefined, `Registration failed for ${userEmail}`);
      return undefined;
    }
  }

  async unregisterFromSession(sessionId: string, userEmail: string): Promise<Session | undefined> {
    const endpoint = `/users/${FORUM_MAILBOX}/calendar/events/${sessionId}`;
    
    try {
      // Get current attendees
      const event = await this.executeWithRetry("GET", endpoint, async () => {
        const client = await this.getClient();
        return await client.api(endpoint).select("attendees").get() as CalendarEvent;
      }, `Get attendees for unregistration: ${userEmail}`);

      const existingAttendees = event.attendees || [];
      const updatedAttendees = existingAttendees.filter(
        (a) => !emailsMatch(a.emailAddress.address, userEmail)
      );

      await this.executeWithRetry("PATCH", endpoint, async () => {
        const client = await this.getClient();
        return await client.api(endpoint).patch({ attendees: updatedAttendees });
      }, `Unregister user: ${userEmail}`);
      
      console.log(`[${new Date().toISOString()}] [REGISTRATION] User ${userEmail} unregistered from session ${sessionId}`);

      return this.getSession(sessionId);
    } catch (error) {
      logApiError("PATCH", endpoint, error, undefined, `Unregistration failed for ${userEmail}`);
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
