import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
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
const ONE_HOUR = 1000 * 60 * 60;
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "warzone-twitch-bot-secret",
  name: "warzone.sid",
  resave: true, // Changed to true to ensure session is saved
  saveUninitialized: true, // Changed to true to ensure new sessions are saved
  store: new MemoryStore({
    checkPeriod: ONE_HOUR // Prune expired entries every hour
  }),
  cookie: {
    secure: false, // Must be false for non-HTTPS
    httpOnly: true,
    maxAge: ONE_HOUR,
    path: '/',
    sameSite: 'lax'
  }
});

// CORS configuration - Must be before session middleware
app.use((req, res, next) => {
  const origin = req.headers.origin || "";
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Debug logging
app.use((req, res, next) => {
  console.log('[Request Debug]', {
    url: req.url,
    method: req.method,
    cookies: req.headers.cookie,
    sessionID: req.sessionID
  });
  next();
});

// Apply middlewares in correct order
app.use(sessionMiddleware);
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

    server.keepAliveTimeout = 120000; // 2 minutes
    server.headersTimeout = 120000; // 2 minutes

    server.listen(5000, "0.0.0.0", () => {
      console.log("[Server] Started on port 5000");
    });
  } catch (error) {
    console.error("[Server] Failed to start:", error);
    process.exit(1);
  }
})();