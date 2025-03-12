import passport from "passport";
import { Strategy as TwitchStrategy } from "passport-twitch-latest";
import { storage } from "./storage";
import type { Config } from "@shared/schema";

if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET) {
  throw new Error("Missing Twitch OAuth credentials");
}

// Simple user serialization
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Configure Twitch Strategy
passport.use(new TwitchStrategy(
  {
    clientID: process.env.TWITCH_CLIENT_ID,
    clientSecret: process.env.TWITCH_CLIENT_SECRET,
    callbackURL: "https://warzonechatter.jphilistin12.repl.co/api/auth/twitch/callback",
    scope: ["chat:read", "chat:edit"],
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const user = {
        id: profile.id,
        login: profile.login,
        accessToken
      };

      // Store the config
      let config = await storage.getConfig();
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
      return done(error as Error);
    }
  }
));

export function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}