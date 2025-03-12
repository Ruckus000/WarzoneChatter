import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertConfigSchema } from "@shared/schema";
import passport from "passport";
import { isAuthenticated } from "./auth";

function logRouteEvent(event: string, data?: any) {
  console.log(`[Routes ${new Date().toISOString()}] ${event}`, data ? JSON.stringify(data, null, 2) : '');
}

export async function registerRoutes(app: Express) {
  // Auth routes
  app.get("/api/auth/twitch", (req, res, next) => {
    logRouteEvent("Starting Twitch auth", { 
      session: !!req.session,
      sessionID: req.sessionID
    });

    passport.authenticate("twitch", {
      successRedirect: "/",
      failureRedirect: "/?error=auth_failed",
      failureMessage: true
    })(req, res, next);
  });

  app.get("/api/auth/twitch/callback", (req, res, next) => {
    logRouteEvent("Received Twitch callback", {
      query: req.query,
      error: req.query.error,
      errorDescription: req.query.error_description,
      session: !!req.session,
      sessionID: req.sessionID
    });

    if (req.query.error === 'redirect_mismatch') {
      logRouteEvent("Redirect mismatch error", { 
        registeredCallback: "https://warzonechatter.jphilistin12.repl.co/api/auth/twitch/callback"
      });
      return res.redirect("/?error=redirect_mismatch");
    }

    passport.authenticate("twitch", (err: any, user: any) => {
      if (err) {
        logRouteEvent("Authentication error", { error: err.message, stack: err.stack });
        return res.redirect("/?error=auth_failed");
      }

      if (!user) {
        logRouteEvent("No user returned from auth");
        return res.redirect("/?error=auth_failed");
      }

      req.logIn(user, (loginErr) => {
        if (loginErr) {
          logRouteEvent("Login error", { error: loginErr.message, stack: loginErr.stack });
          return res.redirect("/?error=auth_failed");
        }

        logRouteEvent("User successfully authenticated", { 
          user: user.login,
          session: !!req.session,
          sessionID: req.sessionID
        });

        return res.redirect("/");
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    logRouteEvent("Logout initiated", { sessionID: req.sessionID });
    req.logout(() => {
      logRouteEvent("Logout successful", { sessionID: req.sessionID });
      res.json({ success: true });
    });
  });

  app.get("/api/auth/status", (req, res) => {
    const status = {
      authenticated: req.isAuthenticated(),
      user: req.user,
      session: !!req.session,
      sessionID: req.sessionID
    };

    logRouteEvent("Auth status check", status);
    res.json({ authenticated: status.authenticated, user: status.user });
  });

  // Protected config routes
  app.get("/api/config", isAuthenticated, async (req, res) => {
    try {
      const config = await storage.getConfig();
      logRouteEvent("Config fetched", { hasConfig: !!config });
      res.json(config || null);
    } catch (error) {
      logRouteEvent("Config fetch error", { error: error.message });
      res.status(500).json({ message: "Failed to fetch config" });
    }
  });

  app.patch("/api/config", isAuthenticated, async (req, res) => {
    try {
      const result = insertConfigSchema.partial().safeParse(req.body);
      if (!result.success) {
        logRouteEvent("Invalid config update", { errors: result.error.issues });
        return res.status(400).json({ message: "Invalid configuration update" });
      }

      const config = await storage.updateConfig(result.data);
      logRouteEvent("Config updated", config);
      res.json(config);
    } catch (error) {
      logRouteEvent("Config update error", { error: error.message });
      res.status(500).json({ message: "Failed to update config" });
    }
  });

  return createServer(app);
}