import { z } from "zod";

// Speaker schema
export const speakerSchema = z.object({
  name: z.string(),
  email: z.string(),
  photoUrl: z.string().optional(),
});

export type Speaker = z.infer<typeof speakerSchema>;

// Attendee schema - includes name from Outlook invitation
export const attendeeSchema = z.object({
  name: z.string(),
  email: z.string(),
  photoUrl: z.string().optional(),
});

export type Attendee = z.infer<typeof attendeeSchema>;

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
  speakers: z.array(speakerSchema), // Array of speakers (required attendees)
  attendees: z.array(attendeeSchema), // Array of attendees with name and email
  capacity: z.number().optional(), // Maximum number of attendees (from back-matter)
  // Counts for unauthenticated users (when personal data is stripped)
  speakerCount: z.number().optional(),
  attendeeCount: z.number().optional(),
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
  photoUrl: z.string().optional(),
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
