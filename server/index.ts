import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import session from "express-session";
import passport from "passport";
import memorystore from "memorystore";
import "./auth";

const app = express();

function logServerEvent(event: string, data?: any) {
  console.log(`[Server ${new Date().toISOString()}] ${event}`, data ? JSON.stringify(data, null, 2) : '');
}

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
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
});

// Log session creation
app.use((req, res, next) => {
  const originalEnd = res.end;
  res.end = function(...args) {
    logServerEvent('Response finished', {
      method: req.method,
      path: req.path,
      sessionID: req.sessionID,
      statusCode: res.statusCode
    });
    // @ts-ignore
    originalEnd.apply(res, args);
  };
  next();
});

app.use(sessionMiddleware);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());


// Start the server
(async () => {
  try {
    const server = await registerRoutes(app);

    // Error handling
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      logServerEvent("Server Error", { 
        error: err.message,
        stack: err.stack
      });
      res.status(500).json({ message: "Internal Server Error" });
    });

    if (process.env.NODE_ENV !== "production") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    server.listen(5000, "0.0.0.0", () => {
      logServerEvent("Server started", { port: 5000 });
    });
  } catch (error) {
    logServerEvent("Failed to start server", { 
      error: error.message,
      stack: error.stack 
    });
    process.exit(1);
  }
})();