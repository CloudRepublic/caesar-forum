import { z } from "zod";

// Session schema - categories come directly from Outlook
export const sessionSchema = z.object({
  id: z.string(),
  slug: z.string(), // URL-friendly identifier (e.g., "farewell-swashbuckle-a1b2c3")
  title: z.string(),
  description: z.string(), // Plain text fallback
  descriptionHtml: z.string().optional(), // Sanitized HTML content from Outlook
  categories: z.array(z.string()), // Outlook categories (e.g., ["Talk", "Workshop"])
  startTime: z.string(), // ISO datetime
  endTime: z.string(), // ISO datetime
  room: z.string(),
  speakerName: z.string(),
  speakerEmail: z.string(),
  speakerPhotoUrl: z.string().optional(),
  attendees: z.array(z.string()), // Array of email addresses
});

export type Session = z.infer<typeof sessionSchema>;

// Forum Edition schema
export const forumEditionSchema = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string(), // ISO date
  location: z.string(),
});

export type ForumEdition = z.infer<typeof forumEditionSchema>;

// User schema (for mock authentication)
export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
});

export type User = z.infer<typeof userSchema>;

// Registration request schema
export const registrationRequestSchema = z.object({
  sessionId: z.string(),
  userEmail: z.string().email(),
  userName: z.string().optional(),
});

export type RegistrationRequest = z.infer<typeof registrationRequestSchema>;

// API response types
export interface ForumData {
  edition: ForumEdition;
  sessions: Session[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
