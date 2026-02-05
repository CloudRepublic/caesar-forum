import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage, GraphApiUnavailableError } from "./storage";
import { z } from "zod";

const sessionIdSchema = z.object({
  sessionId: z.string(),
});

const dietaryPreferenceSchema = z.object({
  sessionId: z.string(),
  preference: z.string().max(500),
});

// Check if user is a dietary admin
function isDietaryAdmin(email: string): boolean {
  const admins = process.env.DIETARY_ADMINS || "";
  const adminList = admins.split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
  return adminList.includes(email.toLowerCase());
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Get forum data (edition + sessions)
  // Use ?test=no-events to simulate no upcoming events
  app.get("/api/forum", async (req: Request, res: Response) => {
    try {
      // Test mode: simulate no events at all
      if (req.query.test === "no-events") {
        return res.json({
          edition: {
            id: "no-events",
            title: "Geen aankomend event",
            date: new Date().toISOString().split("T")[0],
            location: "",
          },
          sessions: [],
        });
      }

      // Test mode: simulate event exists but no sessions yet
      if (req.query.test === "no-sessions") {
        return res.json({
          edition: {
            id: "edition-2026-02",
            title: "Caesar Forum - Februari 2026",
            date: "2026-02-10",
            location: "Caesar Hoofdkantoor, Utrecht",
          },
          sessions: [],
        });
      }

      const data = await storage.getForumData();
      
      // Strip personal data (speakers, attendees) if not authenticated
      // but keep counts visible
      const user = req.session.user;
      if (!user) {
        const sanitizedSessions = data.sessions.map(session => ({
          ...session,
          speakers: [],
          attendees: [],
          speakerCount: session.speakers.length,
          attendeeCount: session.attendees.length,
        }));
        return res.json({ ...data, sessions: sanitizedSessions });
      }
      
      res.json(data);
    } catch (error) {
      console.error("Error fetching forum data:", error);
      if (error instanceof GraphApiUnavailableError) {
        return res.status(503).json({ error: error.message, code: "GRAPH_UNAVAILABLE" });
      }
      res.status(500).json({ error: "Er is een onverwachte fout opgetreden." });
    }
  });

  // Get single session by slug
  app.get("/api/sessions/slug/:slug", async (req: Request, res: Response) => {
    try {
      const session = await storage.getSessionBySlug(req.params.slug);
      if (!session) {
        return res.status(404).json({ error: "Sessie niet gevonden" });
      }
      
      // Strip personal data if not authenticated but keep counts
      const user = req.session.user;
      if (!user) {
        return res.json({ 
          ...session, 
          speakers: [], 
          attendees: [],
          speakerCount: session.speakers.length,
          attendeeCount: session.attendees.length,
        });
      }
      
      res.json(session);
    } catch (error) {
      console.error("Error fetching session by slug:", error);
      if (error instanceof GraphApiUnavailableError) {
        return res.status(503).json({ error: error.message, code: "GRAPH_UNAVAILABLE" });
      }
      res.status(500).json({ error: "Er is een onverwachte fout opgetreden." });
    }
  });

  // Get single session by ID (legacy, for registrations)
  app.get("/api/sessions/:id", async (req: Request, res: Response) => {
    try {
      const session = await storage.getSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Sessie niet gevonden" });
      }
      
      // Strip personal data if not authenticated but keep counts
      const user = req.session.user;
      if (!user) {
        return res.json({ 
          ...session, 
          speakers: [], 
          attendees: [],
          speakerCount: session.speakers.length,
          attendeeCount: session.attendees.length,
        });
      }
      
      res.json(session);
    } catch (error) {
      console.error("Error fetching session:", error);
      if (error instanceof GraphApiUnavailableError) {
        return res.status(503).json({ error: error.message, code: "GRAPH_UNAVAILABLE" });
      }
      res.status(500).json({ error: "Er is een onverwachte fout opgetreden." });
    }
  });

  // Register for a session (requires authentication)
  app.post("/api/sessions/register", async (req: Request, res: Response) => {
    try {
      const user = req.session.user;
      if (!user) {
        return res.status(401).json({ error: "Je moet ingelogd zijn om je in te schrijven" });
      }

      const parsed = sessionIdSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body", details: parsed.error.errors });
      }

      const { sessionId } = parsed.data;
      const session = await storage.registerForSession(sessionId, user.email, user.name);
      
      if (!session) {
        return res.status(404).json({ error: "Sessie niet gevonden" });
      }

      res.json({ success: true, session });
    } catch (error) {
      console.error("Error registering for session:", error);
      if (error instanceof GraphApiUnavailableError) {
        return res.status(503).json({ error: error.message, code: "GRAPH_UNAVAILABLE" });
      }
      res.status(500).json({ error: "Er is een onverwachte fout opgetreden bij het inschrijven." });
    }
  });

  // Unregister from a session (requires authentication)
  app.post("/api/sessions/unregister", async (req: Request, res: Response) => {
    try {
      const user = req.session.user;
      if (!user) {
        return res.status(401).json({ error: "Je moet ingelogd zijn om je uit te schrijven" });
      }

      const parsed = sessionIdSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body", details: parsed.error.errors });
      }

      const { sessionId } = parsed.data;
      const session = await storage.unregisterFromSession(sessionId, user.email);
      
      if (!session) {
        return res.status(404).json({ error: "Sessie niet gevonden" });
      }

      res.json({ success: true, session });
    } catch (error) {
      console.error("Error unregistering from session:", error);
      if (error instanceof GraphApiUnavailableError) {
        return res.status(503).json({ error: error.message, code: "GRAPH_UNAVAILABLE" });
      }
      res.status(500).json({ error: "Er is een onverwachte fout opgetreden bij het uitschrijven." });
    }
  });

  // Get user photo from Microsoft Graph
  app.get("/api/users/:email/photo", async (req: Request, res: Response) => {
    try {
      const email = decodeURIComponent(req.params.email);
      const photoBuffer = await storage.getUserPhoto(email);
      
      if (!photoBuffer) {
        return res.status(404).json({ error: "Photo not found" });
      }

      res.set("Content-Type", "image/jpeg");
      res.set("Cache-Control", "public, max-age=86400");
      res.send(photoBuffer);
    } catch (error) {
      console.error("Error fetching user photo:", error);
      res.status(500).json({ error: "Failed to fetch user photo" });
    }
  });

  // Get user info from Microsoft Graph
  app.get("/api/users/:email", async (req: Request, res: Response) => {
    try {
      const email = decodeURIComponent(req.params.email);
      const userInfo = await storage.getUserInfo(email);
      
      if (!userInfo) {
        return res.status(404).json({ error: "User not found" });
      }

      res.set("Cache-Control", "public, max-age=3600");
      res.json(userInfo);
    } catch (error) {
      console.error("Error fetching user info:", error);
      res.status(500).json({ error: "Failed to fetch user info" });
    }
  });

  // Save dietary preference for a session (requires authentication)
  app.post("/api/dietary-preferences", async (req: Request, res: Response) => {
    try {
      const user = req.session.user;
      if (!user) {
        return res.status(401).json({ error: "Je moet ingelogd zijn om dieetwensen door te geven" });
      }

      const parsed = dietaryPreferenceSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body", details: parsed.error.errors });
      }

      const { sessionId, preference } = parsed.data;
      await storage.setDietaryPreference(sessionId, user.email, user.name, preference);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving dietary preference:", error);
      res.status(500).json({ error: "Er is een fout opgetreden bij het opslaan van dieetwensen." });
    }
  });

  // Get my dietary preference for a session (requires authentication)
  app.get("/api/dietary-preferences/:sessionId/me", async (req: Request, res: Response) => {
    try {
      const user = req.session.user;
      if (!user) {
        return res.status(401).json({ error: "Je moet ingelogd zijn" });
      }

      const preference = await storage.getDietaryPreference(req.params.sessionId, user.email);
      res.json({ preference: preference?.preference || null });
    } catch (error) {
      console.error("Error fetching dietary preference:", error);
      res.status(500).json({ error: "Er is een fout opgetreden." });
    }
  });

  // Get all dietary preferences (dietary admins only)
  app.get("/api/dietary-preferences", async (req: Request, res: Response) => {
    try {
      const user = req.session.user;
      if (!user) {
        return res.status(401).json({ error: "Je moet ingelogd zijn" });
      }

      if (!isDietaryAdmin(user.email)) {
        return res.status(403).json({ error: "Je hebt geen toegang tot dit overzicht" });
      }

      // Get all preferences and enrich with session data
      const allPrefs = await storage.getAllDietaryPreferences();
      const forumData = await storage.getForumData();
      
      const result: Array<{
        session: { id: string; title: string; slug: string };
        preferences: Array<{ email: string; name: string; preference: string; submittedAt: string }>;
      }> = [];

      const entries = Array.from(allPrefs.entries());
      entries.forEach(([sessionId, prefs]) => {
        const session = forumData.sessions.find(s => s.id === sessionId);
        if (session && prefs.length > 0) {
          result.push({
            session: { id: session.id, title: session.title, slug: session.slug },
            preferences: prefs,
          });
        }
      });

      res.json({ sessions: result });
    } catch (error) {
      console.error("Error fetching all dietary preferences:", error);
      if (error instanceof GraphApiUnavailableError) {
        return res.status(503).json({ error: error.message, code: "GRAPH_UNAVAILABLE" });
      }
      res.status(500).json({ error: "Er is een fout opgetreden." });
    }
  });

  // Check if user is dietary admin
  app.get("/api/dietary-preferences/admin-check", async (req: Request, res: Response) => {
    try {
      const user = req.session.user;
      if (!user) {
        return res.json({ isAdmin: false });
      }

      res.json({ isAdmin: isDietaryAdmin(user.email) });
    } catch (error) {
      console.error("Error checking dietary admin status:", error);
      res.status(500).json({ error: "Er is een fout opgetreden." });
    }
  });

  return httpServer;
}
