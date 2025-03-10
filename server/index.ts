import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set up API response headers for all API routes to prevent HTML responses
app.use('/api', (req, res, next) => {
  // Force content type for all API responses
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Override res.send for API routes to ensure JSON responses
  const originalSend = res.send;
  res.send = function(body) {
    // If body is not a string, stringify it
    if (typeof body !== 'string') {
      return originalSend.call(this, JSON.stringify(body));
    }
    
    // If body is a string but not JSON, wrap it in JSON
    if (!body.startsWith('{') && !body.startsWith('[')) {
      return originalSend.call(this, JSON.stringify({ data: body }));
    }
    
    return originalSend.call(this, body);
  };
  
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Add request timeout middleware
  app.use((req, res, next) => {
    req.setTimeout(5000, () => {
      log(`Request timeout: ${req.method} ${req.path}`);
      if (!res.headersSent) {
        if (req.path.startsWith('/api')) {
          res.status(408).json({ message: "Request Timeout" });
        } else {
          next();
        }
      }
    });
    next();
  });

  const server = await registerRoutes(app);

  // Handle API errors consistently with JSON responses
  app.use('/api', (err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    if (!res.headersSent) {
      res.status(status).json({ error: message });
    }
    log(`API Error: ${err.message}`);
  });

  // General error handler for non-API routes
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    if (!res.headersSent) {
      if (_req.path.startsWith('/api')) {
        res.status(status).json({ error: message });
      } else {
        _next(err);
      }
    }
    log(`Error: ${err.message}`);
  });

  // Add a final API error handler to ensure API routes return JSON
  app.use('/api/*', (req, res) => {
    // This is a catch-all for API routes that weren't handled
    res.status(404).json({ 
      error: "API endpoint not found", 
      path: req.originalUrl 
    });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use a different port if 5000 is already in use
  const port = 5000;
  server.listen({
    port
  }, () => {
    log(`serving on port ${port}`);
  });
})();
