import passport from "passport";
import { Strategy as TwitchStrategy } from "passport-twitch-latest";
import { storage } from "./storage";
import type { Config } from "@shared/schema";

if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET) {
  throw new Error("Missing Twitch OAuth credentials");
}

// Add debug logging
function logAuthEvent(event: string, data?: any) {
  console.log(`[Auth ${new Date().toISOString()}] ${event}`, data ? JSON.stringify(data, null, 2) : '');
}

passport.serializeUser((user: any, done) => {
  logAuthEvent('Serializing user', { id: user.id, login: user.login });
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  logAuthEvent('Deserializing user', { id: user.id, login: user.login });
  done(null, user);
});

passport.use(
  new TwitchStrategy(
    {
      clientID: process.env.TWITCH_CLIENT_ID,
      clientSecret: process.env.TWITCH_CLIENT_SECRET,
      callbackURL: "https://warzonechatter.jphilistin12.repl.co/api/auth/twitch/callback",
      scope: ["chat:read", "chat:edit"],
    },
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        logAuthEvent('Twitch strategy callback', {
          profileId: profile.id,
          login: profile.login,
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken
        });

        const user = {
          id: profile.id,
          login: profile.login,
          accessToken
        };

        // Store initial config
        try {
          const config = await storage.getConfig();
          if (!config) {
            logAuthEvent('Creating initial config', { login: profile.login });
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
            logAuthEvent('Updating existing config', { login: profile.login });
            await storage.updateConfig({
              twitchChannel: profile.login,
              twitchUsername: profile.login,
              twitchToken: `oauth:${accessToken}`
            });
          }
        } catch (configError) {
          logAuthEvent('Config error', { error: configError.message });
        }

        return done(null, user);
      } catch (error) {
        logAuthEvent('Auth error', { error: error.message, stack: error.stack });
        return done(error);
      }
    }
  )
);

export function isAuthenticated(req: any, res: any, next: any) {
  logAuthEvent('Checking authentication', { 
    isAuthenticated: req.isAuthenticated(),
    hasSession: !!req.session,
    hasUser: !!req.user
  });

  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}