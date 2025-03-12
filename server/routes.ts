import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertConfigSchema } from "@shared/schema";
import passport from "passport";
import { isAuthenticated } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.get("/api/auth/twitch", passport.authenticate("twitch", {
    scope: ["chat:read", "chat:edit"],
    failureRedirect: "/?error=auth_failed",
  }));

  app.get("/api/auth/twitch/callback",
    (req, res, next) => {
      passport.authenticate("twitch", {
        failureRedirect: "/?error=auth_failed",
        failureMessage: true,
      })(req, res, (err) => {
        if (err) {
          console.error("Auth Error:", err);
          return res.redirect("/?error=auth_failed");
        }
        res.redirect("/");
      });
    }
  );

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/auth/status", (req, res) => {
    console.log("Auth Status:", {
      isAuthenticated: req.isAuthenticated(),
      session: req.session,
      user: req.user
    });

    res.json({
      authenticated: req.isAuthenticated(),
      user: req.user
    });
  });

  // Protected config routes
  app.get("/api/config", isAuthenticated, async (req, res) => {
    const config = await storage.getConfig();
    res.json(config || null);
  });

  app.patch("/api/config", isAuthenticated, async (req, res) => {
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