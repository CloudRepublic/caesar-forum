import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";

const sessionIdSchema = z.object({
  sessionId: z.string(),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Get forum data (edition + sessions)
  app.get("/api/forum", async (_req: Request, res: Response) => {
    try {
      const data = await storage.getForumData();
      res.json(data);
    } catch (error) {
      console.error("Error fetching forum data:", error);
      res.status(500).json({ error: "Failed to fetch forum data" });
    }
  });

  // Get single session
  app.get("/api/sessions/:id", async (req: Request, res: Response) => {
    try {
      const session = await storage.getSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      console.error("Error fetching session:", error);
      res.status(500).json({ error: "Failed to fetch session" });
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
        return res.status(404).json({ error: "Session not found" });
      }

      res.json({ success: true, session });
    } catch (error) {
      console.error("Error registering for session:", error);
      res.status(500).json({ error: "Failed to register for session" });
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
        return res.status(404).json({ error: "Session not found" });
      }

      res.json({ success: true, session });
    } catch (error) {
      console.error("Error unregistering from session:", error);
      res.status(500).json({ error: "Failed to unregister from session" });
    }
  });

  return httpServer;
}
