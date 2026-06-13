import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import { serverConfig } from "./src/server/config";

// Initialize express app
const app = express();
const PORT = serverConfig.port;
const HOST = serverConfig.host;

if (serverConfig.isProduction) {
  app.set("trust proxy", 1);
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (serverConfig.allowedOrigins.length === 0) return callback(null, true);
      if (serverConfig.allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Origine non autorisée par CORS"));
    },
  })
);
app.use(express.json({ limit: "1mb" }));
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, environment: serverConfig.nodeEnv });
});

// Server-side backend API routes implementation placeholders
import { handleChariowWebhook } from "./src/server/webhooks";
import adminRoutes from "./src/server/adminRoutes";

import publicRoutes from "./src/server/publicRoutes";

app.post("/api/webhooks/chariow", handleChariowWebhook);

// Serve admin sub-routes
app.use("/api/admin", adminRoutes);

// Public API routes
app.use("/api/public", publicRoutes);

// Serve the app
async function startServer() {
  if (!serverConfig.isProduction) {
    console.log("Starting server in development mode");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get(/^\/(?!api).*/, (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
  });
}

startServer();
