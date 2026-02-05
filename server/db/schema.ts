import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const dietaryPreferences = pgTable("dietary_preferences", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  preference: text("preference").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

export const insertDietaryPreferenceSchema = createInsertSchema(dietaryPreferences).omit({
  id: true,
  submittedAt: true,
});

export type InsertDietaryPreference = z.infer<typeof insertDietaryPreferenceSchema>;
export type DietaryPreferenceRow = typeof dietaryPreferences.$inferSelect;
