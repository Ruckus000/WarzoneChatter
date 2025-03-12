import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import session from "express-session";
import passport from "passport";
import memorystore from "memorystore";
import "./auth";

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
const MemoryStore = memorystore(session);
const sessionMiddleware = session({
  secret: "warzone-twitch-bot-secret",
  name: "warzone.sid",
  resave: true,
  saveUninitialized: true,
  store: new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  cookie: {
    secure: false, // Must be false as we're not using HTTPS in development
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/',
    sameSite: 'lax'
  }
});

// Add debug logging
app.use((req, res, next) => {
  const originalEnd = res.end;
  res.end = function(...args) {
    console.log(`[Session Debug] Request completed:`, {
      method: req.method,
      path: req.path,
      sessionID: req.sessionID,
      hasSession: !!req.session,
      isAuthenticated: req.isAuthenticated?.(),
      statusCode: res.statusCode
    });
    // @ts-ignore
    originalEnd.apply(res, args);
  };
  next();
});

app.use(sessionMiddleware);

// Initialize Passport after session middleware
app.use(passport.initialize());
app.use(passport.session());

// Start the server
(async () => {
  try {
    const server = await registerRoutes(app);

    // Error handling
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error("[Server Error]", {
        message: err.message,
        stack: err.stack,
        status: err.status || 500
      });
      res.status(500).json({ message: "Internal Server Error" });
    });

    if (process.env.NODE_ENV !== "production") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    server.listen(5000, "0.0.0.0", () => {
      console.log("[Server] Started on port 5000");
    });
  } catch (error) {
    console.error("[Server] Failed to start:", error);
    process.exit(1);
  }
})();