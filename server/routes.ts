import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertConfigSchema } from "@shared/schema";
import passport from "passport";
import { isAuthenticated } from "./auth";

function logRouteEvent(event: string, data?: any) {
  console.log(`[Routes Debug] ${event}`, data);
}

export async function registerRoutes(app: Express) {
  // Auth routes
  app.get("/api/auth/twitch", (req, res, next) => {
    logRouteEvent("Starting Twitch auth", { 
      sessionId: req.sessionID,
      hasSession: !!req.session
    });

    passport.authenticate("twitch", {
      scope: ["chat:read", "chat:edit"],
      state: true
    })(req, res, next);
  });

  app.get("/api/auth/twitch/callback", (req, res, next) => {
    logRouteEvent("Auth callback received", { 
      query: req.query,
      sessionId: req.sessionID,
      hasSession: !!req.session
    });

    passport.authenticate("twitch", (err: any, user: any) => {
      if (err || !user) {
        logRouteEvent("Authentication failed", { error: err?.message });
        return res.send(`
          <script>
            window.opener.postMessage('twitch-auth-failed', '*');
            window.close();
          </script>
        `);
      }

      req.logIn(user, (loginErr) => {
        if (loginErr) {
          logRouteEvent("Login failed", { error: loginErr.message });
          return res.send(`
            <script>
              window.opener.postMessage('twitch-auth-failed', '*');
              window.close();
            </script>
          `);
        }

        logRouteEvent("Authentication successful", { 
          userId: user.id,
          sessionId: req.sessionID
        });

        res.send(`
          <script>
            window.opener.postMessage('twitch-auth-success', '*');
            window.close();
          </script>
        `);
      });
    })(req, res, next);
  });

  app.get("/api/auth/status", (req, res) => {
    const authenticated = req.isAuthenticated();
    logRouteEvent("Auth status check", { 
      authenticated,
      sessionId: req.sessionID,
      hasSession: !!req.session,
      hasUser: !!req.user
    });

    res.json({
      authenticated,
      user: authenticated ? req.user : null
    });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      logRouteEvent("Logout completed");
      res.json({ success: true });
    });
  });

  // Protected routes
  app.get("/api/config", isAuthenticated, async (req, res) => {
    try {
      const config = await storage.getConfig();
      res.json(config || null);
    } catch (error) {
      logRouteEvent("Config fetch error", { error });
      res.status(500).json({ message: "Failed to fetch config" });
    }
  });

  app.patch("/api/config", isAuthenticated, async (req, res) => {
    try {
      const result = insertConfigSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid configuration" });
      }

      const config = await storage.updateConfig(result.data);
      res.json(config);
    } catch (error) {
      logRouteEvent("Config update error", { error });
      res.status(500).json({ message: "Failed to update config" });
    }
  });

  return createServer(app);
}