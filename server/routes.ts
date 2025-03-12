import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertConfigSchema } from "@shared/schema";
import passport from "passport";
import { isAuthenticated } from "./auth";

export async function registerRoutes(app: Express) {
  // Auth routes
  app.get("/api/auth/twitch", (req, res, next) => {
    console.log("Starting Twitch auth...");
    passport.authenticate("twitch")(req, res, next);
  });

  app.get("/api/auth/twitch/callback", (req, res, next) => {
    console.log("Received callback from Twitch");

    passport.authenticate("twitch", (err: any, user: any) => {
      if (err) {
        console.error("Auth callback error:", err);
        return res.redirect("/?error=auth_failed");
      }

      if (!user) {
        console.error("No user returned from auth");
        return res.redirect("/?error=auth_failed");
      }

      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error("Login error:", loginErr);
          return res.redirect("/?error=auth_failed");
        }

        console.log("User successfully authenticated:", user.login);
        res.redirect("/");
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    const wasAuthenticated = req.isAuthenticated();
    req.logout(() => {
      if (wasAuthenticated) {
        console.log("User logged out successfully");
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/status", (req, res) => {
    const status = {
      authenticated: req.isAuthenticated(),
      user: req.user
    };
    console.log("Auth status:", status);
    res.json(status);
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