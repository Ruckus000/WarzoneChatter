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

// Generate a strong session secret
const generateSessionSecret = () => {
  const randomPart = Math.random().toString(36).substring(2) + 
                    Math.random().toString(36).substring(2);
  return `warzone-twitch-bot-${randomPart}`;
};

// Session configuration
const MemoryStore = memorystore(session);
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || generateSessionSecret(),
  name: "warzone.sid",
  resave: false,
  saveUninitialized: false,
  store: new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/',
    sameSite: process.env.NODE_ENV === "production" ? 'strict' : 'lax'
  }
});

// Add debug logging for session tracking
app.use((req, res, next) => {
  console.log(`[Session Debug] Request started:`, {
    method: req.method,
    path: req.path,
    cookies: req.headers.cookie,
    origin: req.headers.origin
  });
  next();
});

// CORS configuration
app.use((req, res, next) => {
  const allowedOrigins = process.env.NODE_ENV === "production" 
    ? ["https://warzonechatter.jphilistin12.repl.co"]
    : ["http://localhost:5000"];

  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(sessionMiddleware);

// Initialize Passport after session middleware
app.use(passport.initialize());
app.use(passport.session());

// Final response logging
app.use((req, res, next) => {
  const originalEnd = res.end;
  res.end = function(...args) {
    console.log(`[Session Debug] Request completed:`, {
      method: req.method,
      path: req.path,
      sessionID: req.sessionID,
      hasSession: !!req.session,
      isAuthenticated: req.isAuthenticated?.(),
      statusCode: res.statusCode,
      cookies: req.headers.cookie
    });
    // @ts-ignore
    originalEnd.apply(res, args);
  };
  next();
});

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

    // Configure server timeouts
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