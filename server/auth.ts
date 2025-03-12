import passport from "passport";
import { Strategy as TwitchStrategy } from "passport-twitch-latest";
import { storage } from "./storage";
import type { Config } from "@shared/schema";

if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET) {
  throw new Error("Missing Twitch OAuth credentials");
}

// Add debug logging
function logAuthEvent(event: string, data?: any) {
  console.log(`[Auth Debug] ${event}`, data);
}

// Simple user serialization
passport.serializeUser((user: any, done) => {
  logAuthEvent("Serializing user", { id: user.id });
  done(null, { id: user.id, login: user.login, accessToken: user.accessToken });
});

passport.deserializeUser((serialized: any, done) => {
  logAuthEvent("Deserializing user", { id: serialized.id });
  done(null, serialized);
});

const CALLBACK_URL = process.env.NODE_ENV === "production"
  ? "https://warzonechatter.jphilistin12.repl.co/api/auth/twitch/callback"
  : "http://localhost:5000/api/auth/twitch/callback";

logAuthEvent("Initializing Twitch Strategy", { callbackUrl: CALLBACK_URL });

passport.use(
  new TwitchStrategy(
    {
      clientID: process.env.TWITCH_CLIENT_ID,
      clientSecret: process.env.TWITCH_CLIENT_SECRET,
      callbackURL: CALLBACK_URL,
      scope: ["chat:read", "chat:edit"],
      state: true // Enable CSRF protection
    },
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        logAuthEvent("Processing Twitch callback", {
          profileId: profile.id,
          login: profile.login
        });

        const user = {
          id: profile.id,
          login: profile.login,
          accessToken
        };

        try {
          const config = await storage.getConfig();
          if (!config) {
            await storage.saveConfig({
              twitchChannel: profile.login,
              twitchUsername: profile.login,
              twitchToken: `oauth:${accessToken}`,
              enabled: true,
              killMessageTemplate: "(kills) enemies eliminated",
              deathMessageTemplate: "Defeated in battle",
              matchEndMessageTemplate: "Match complete with (kills) kills"
            });
          } else {
            await storage.updateConfig({
              twitchChannel: profile.login,
              twitchUsername: profile.login,
              twitchToken: `oauth:${accessToken}`
            });
          }
        } catch (error) {
          logAuthEvent("Config error", { error });
        }

        logAuthEvent("Authentication successful", { userId: user.id });
        return done(null, user);
      } catch (error) {
        logAuthEvent("Authentication failed", { error });
        return done(error);
      }
    }
  )
);

export function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}