import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertConfigSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/config", async (req, res) => {
    const config = await storage.getConfig();
    res.json(config || null);
  });

  app.post("/api/config", async (req, res) => {
    const result = insertConfigSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ message: "Invalid configuration" });
      return;
    }

    const config = await storage.saveConfig(result.data);
    res.json(config);
  });

  app.patch("/api/config", async (req, res) => {
    const result = insertConfigSchema.partial().safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ message: "Invalid configuration update" });
      return;
    }

    try {
      const config = await storage.updateConfig(result.data);
      res.json(config);
    } catch (err) {
      res.status(404).json({ message: "No configuration exists to update" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
