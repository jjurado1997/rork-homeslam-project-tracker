import { serve } from '@hono/node-server';
import app from './backend/hono';

const port = process.env.PORT ? parseInt(process.env.PORT) : 8081;

console.log(`🚀 Starting HomeSlam backend server on port ${port}`);

serve({
  fetch: app.fetch,
  port,
}, (info) => {
  console.log(`✅ HomeSlam backend server is running on http://localhost:${info.port}`);
  console.log(`📡 tRPC endpoint available at http://localhost:${info.port}/api/trpc`);
  console.log(`🏥 Health check available at http://localhost:${info.port}/api`);
});