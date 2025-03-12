import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertConfigSchema } from "@shared/schema";
import passport from "passport";
import { isAuthenticated } from "./auth";

export async function registerRoutes(app: Express) {
  // Auth routes
  app.get("/api/auth/twitch", passport.authenticate("twitch"));

  app.get("/api/auth/twitch/callback", (req, res, next) => {
    passport.authenticate("twitch", (err, user) => {
      if (err) {
        console.error("Authentication error:", err);
        return res.redirect("/?error=auth_failed");
      }

      if (!user) {
        return res.redirect("/?error=auth_failed");
      }

      req.logIn(user, (err) => {
        if (err) {
          console.error("Login error:", err);
          return res.redirect("/?error=auth_failed");
        }
        return res.redirect("/");
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/auth/status", (req, res) => {
    res.json({
      authenticated: req.isAuthenticated(),
      user: req.user
    });
  });

  // Protected config routes
  app.get("/api/config", isAuthenticated, async (req, res) => {
    try {
      const config = await storage.getConfig();
      res.json(config || null);
    } catch (error) {
      console.error("Config fetch error:", error);
      res.status(500).json({ message: "Failed to fetch config" });
    }
  });

  app.patch("/api/config", isAuthenticated, async (req, res) => {
    try {
      const result = insertConfigSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid configuration update" });
      }

      const config = await storage.updateConfig(result.data);
      res.json(config);
    } catch (error) {
      console.error("Config update error:", error);
      res.status(500).json({ message: "Failed to update config" });
    }
  });

  return createServer(app);
}