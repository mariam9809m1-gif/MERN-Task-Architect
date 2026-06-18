import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import userRoutes from "./server/routes/userRoutes";
import auctionRoutes from "./server/routes/auctionRoutes";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for body parsing
  app.use(express.json());

  // Log requests to console
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use("/api/auth", userRoutes);
  app.use("/api/auctions", auctionRoutes);

  // Global Error Handler for unhandled exceptions in routes
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Unhandled Error:", err);
    res.status(500).json({
      message: "An internal server error occurred.",
      error: process.env.NODE_ENV !== "production" ? err.message : undefined,
    });
  });

  // Integrates Vite Middleware in Development, serves static SPA build in Production
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting in DEVELOPMENT mode with Vite dev middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting in PRODUCTION mode. Serving pre-compiled static assets...");
    const distPath = path.join(process.cwd(), "dist");
    
    // Serve static files from the build output directory
    app.use(express.static(distPath));
    
    // Direct all remaining requests to client index.html for Single-Page Routing (React Router)
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`===============================================`);
    console.log(`🚀 AuctionCraft Server successfully booted!`);
    console.log(`🌐 Accessible on http://localhost:${PORT}`);
    console.log(`===============================================`);
  });
}

startServer().catch((error) => {
  console.error("Critical server bootstrap failure:", error);
  process.exit(1);
});
