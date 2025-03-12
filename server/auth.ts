import passport from "passport";
import { Strategy as TwitchStrategy } from "passport-twitch-latest";
import { storage } from "./storage";
import type { Config } from "@shared/schema";

if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET) {
  throw new Error("Missing Twitch OAuth credentials");
}

passport.serializeUser((user: any, done) => {
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  done(null, user);
});

// Configure Twitch Strategy
passport.use(
  new TwitchStrategy(
    {
      clientID: process.env.TWITCH_CLIENT_ID,
      clientSecret: process.env.TWITCH_CLIENT_SECRET,
      callbackURL: process.env.NODE_ENV === "production"
        ? "https://warzonechatter.jphilistin12.repl.co/api/auth/twitch/callback"
        : "http://localhost:5000/api/auth/twitch/callback",
      scope: ["chat:read", "chat:edit"],
      passReqToCallback: true,
    },
    async (req: any, accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        console.log("Twitch auth callback received:", { profile: profile.login });

        const user = {
          id: profile.id,
          login: profile.login,
          accessToken
        };

        // Store initial config
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

        return done(null, user);
      } catch (error) {
        console.error("Auth error:", error);
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