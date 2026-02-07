/**
 * Shared Hono app factory with CORS + logging.
 * Every edge function calls `createApp()` instead of repeating boilerplate.
 */
import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";

export function createApp() {
  const app = new Hono();

  app.use("*", async (c, next) => {
    console.log(`[EDGE] ${c.req.method} ${c.req.path}`);
    await next();
  });

  app.use("*", logger(console.log));

  app.use(
    "/*",
    cors({
      origin: "*",
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      exposeHeaders: ["Content-Length"],
      maxAge: 600,
    })
  );

  return app;
}
