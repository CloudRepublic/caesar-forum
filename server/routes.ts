import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registrationRequestSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Get forum data (edition + sessions)
  app.get("/api/forum", async (_req, res) => {
    try {
      const data = await storage.getForumData();
      res.json(data);
    } catch (error) {
      console.error("Error fetching forum data:", error);
      res.status(500).json({ error: "Failed to fetch forum data" });
    }
  });

  // Get single session
  app.get("/api/sessions/:id", async (req, res) => {
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

  // Register for a session
  app.post("/api/sessions/register", async (req, res) => {
    try {
      const parsed = registrationRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body", details: parsed.error.errors });
      }

      const { sessionId, userEmail } = parsed.data;
      const session = await storage.registerForSession(sessionId, userEmail);
      
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      res.json({ success: true, session });
    } catch (error) {
      console.error("Error registering for session:", error);
      res.status(500).json({ error: "Failed to register for session" });
    }
  });

  // Unregister from a session
  app.post("/api/sessions/unregister", async (req, res) => {
    try {
      const parsed = registrationRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body", details: parsed.error.errors });
      }

      const { sessionId, userEmail } = parsed.data;
      const session = await storage.unregisterFromSession(sessionId, userEmail);
      
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
