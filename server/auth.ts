import passport from "passport";
import { Strategy as TwitchStrategy } from "passport-twitch-latest";
import { storage } from "./storage";
import type { Config } from "@shared/schema";

// Passport serialization
passport.serializeUser((user: any, done) => {
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  done(null, user);
});

if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET) {
  throw new Error("Missing Twitch OAuth credentials");
}

// Setup Twitch Strategy
passport.use(
  new TwitchStrategy(
    {
      clientID: process.env.TWITCH_CLIENT_ID,
      clientSecret: process.env.TWITCH_CLIENT_SECRET,
      callbackURL: process.env.REPL_SLUG 
        ? `https://${process.env.REPL_SLUG}.replit.dev/api/auth/twitch/callback`
        : "http://localhost:5000/api/auth/twitch/callback",
      scope: ["chat:read", "chat:edit"],
    },
    async (_accessToken, _refreshToken, profile: any, done: any) => {
      try {
        // Get or create config with Twitch credentials
        let config = await storage.getConfig();

        if (!config) {
          config = await storage.saveConfig({
            twitchChannel: profile.login,
            twitchUsername: profile.login,
            twitchToken: `oauth:${_accessToken}`,
            enabled: true,
            killMessageTemplate: "(kills) enemies eliminated",
            deathMessageTemplate: "Defeated in battle",
            matchEndMessageTemplate: "Match complete with (kills) kills"
          });
        } else {
          config = await storage.updateConfig({
            twitchChannel: profile.login,
            twitchUsername: profile.login,
            twitchToken: `oauth:${_accessToken}`
          });
        }

        return done(null, { 
          id: profile.id,
          login: profile.login,
          accessToken: _accessToken
        });
      } catch (error) {
        return done(error as Error);
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