import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import backendApp from './backend/hono';

const port = process.env.PORT ? parseInt(process.env.PORT) : 8081;

// Create main app that mounts the backend at /api
const mainApp = new Hono();

// Mount the backend app at /api
mainApp.route('/api', backendApp);

// Add a root route for debugging
mainApp.get('/', (c) => {
  return c.json({
    message: 'HomeSlam Server',
    endpoints: {
      api: '/api',
      trpc: '/api/trpc',
      health: '/api'
    },
    timestamp: new Date().toISOString()
  });
});

console.log(`🚀 Starting HomeSlam backend server on port ${port}`);

serve({
  fetch: mainApp.fetch,
  port,
}, (info) => {
  console.log(`✅ HomeSlam backend server is running on http://localhost:${info.port}`);
  console.log(`📡 tRPC endpoint available at http://localhost:${info.port}/api/trpc`);
  console.log(`🏥 Health check available at http://localhost:${info.port}/api`);
});