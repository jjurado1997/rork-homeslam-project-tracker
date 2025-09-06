import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

// app will be mounted at /api
const app = new Hono();

// Enable CORS for all routes with proper configuration
app.use("*", cors({
  origin: '*', // Allow all origins in development
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Add request logging middleware
app.use("*", async (c, next) => {
  const start = Date.now();
  console.log(`📡 ${c.req.method} ${c.req.url}`);
  
  try {
    await next();
    const ms = Date.now() - start;
    console.log(`✅ ${c.req.method} ${c.req.url} - ${c.res.status} (${ms}ms)`);
  } catch (error) {
    const ms = Date.now() - start;
    console.error(`❌ ${c.req.method} ${c.req.url} - Error (${ms}ms):`, error);
    throw error;
  }
});

// Mount tRPC router at /trpc with proper error handling
app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
    onError: ({ error, path, type, ctx }) => {
      console.error(`❌ tRPC Error on ${path} (${type}):`, error);
      console.error('Context:', ctx);
    },
  })
);

// Simple health check endpoint
app.get("/", (c) => {
  console.log('🏥 Health check requested');
  return c.json({ 
    status: "ok", 
    message: "HomeSlam API is running",
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/api",
      trpc: "/api/trpc"
    }
  });
});

// Test endpoint to verify backend is working
app.get("/test", (c) => {
  console.log('🧪 Test endpoint requested');
  return c.json({ 
    message: "Backend is working!",
    timestamp: new Date().toISOString(),
    method: c.req.method,
    url: c.req.url
  });
});

// Catch-all route for debugging
app.all("*", (c) => {
  console.log(`🔍 Unhandled route: ${c.req.method} ${c.req.url}`);
  return c.json({ 
    error: "Route not found", 
    method: c.req.method,
    path: c.req.url,
    availableEndpoints: {
      health: "/api",
      trpc: "/api/trpc/*"
    }
  }, 404);
});

export default app;