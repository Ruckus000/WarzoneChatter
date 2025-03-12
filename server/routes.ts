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

    // Set a longer timeout for the auth request
    req.socket.setTimeout(120000);
    res.setTimeout(120000);

    passport.authenticate("twitch", {
      scope: ["chat:read", "chat:edit"]
    })(req, res, next);
  });

  app.get("/api/auth/twitch/callback", (req, res, next) => {
    // Set a longer timeout for the callback
    req.socket.setTimeout(120000);
    res.setTimeout(120000);

    logRouteEvent("Auth callback received", { 
      query: req.query,
      sessionId: req.sessionID,
      hasSession: !!req.session,
      error: req.query.error
    });

    if (req.query.error === 'redirect_mismatch') {
      logRouteEvent("Redirect mismatch error detected");
      return res.redirect("/?error=redirect_mismatch");
    }

    passport.authenticate("twitch", (err: any, user: any) => {
      if (err) {
        logRouteEvent("Auth callback error", { error: err.message });
        return res.redirect("/?error=auth_failed");
      }

      if (!user) {
        logRouteEvent("No user returned from auth");
        return res.redirect("/?error=auth_failed");
      }

      req.logIn(user, (loginErr) => {
        if (loginErr) {
          logRouteEvent("Login error", { error: loginErr.message });
          return res.redirect("/?error=auth_failed");
        }

        logRouteEvent("Auth successful", { 
          user: user.login,
          sessionId: req.sessionID
        });
        res.redirect("/");
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