import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  // For Rork platform, the backend is automatically available at the same origin
  if (typeof window !== 'undefined') {
    // Web environment - use current origin
    return window.location.origin;
  }
  
  // For mobile, check if we have the environment variable
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  }

  // Fallback for development
  console.warn('⚠️ EXPO_PUBLIC_RORK_API_BASE_URL not set, using localhost fallback');
  return 'http://localhost:3000';
};

const baseUrl = getBaseUrl();
const trpcUrl = `${baseUrl}/api/trpc`;

console.log('🔗 tRPC client configuration:', {
  baseUrl,
  trpcUrl,
  environment: typeof window !== 'undefined' ? 'web' : 'mobile'
});

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: trpcUrl,
      transformer: superjson,
      fetch: async (url, options) => {
        console.log('📡 tRPC request:', { url, method: options?.method });
        try {
          const response = await fetch(url, options);
          console.log('📡 tRPC response:', { 
            status: response.status, 
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
          });
          
          if (!response.ok) {
            const text = await response.text();
            console.error('❌ tRPC error response:', text);
            throw new Error(`HTTP ${response.status}: ${text}`);
          }
          
          return response;
        } catch (error) {
          console.error('❌ tRPC fetch error:', error);
          throw error;
        }
      },
    }),
  ],
});