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
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        try {
          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              ...options?.headers,
            },
          });
          
          clearTimeout(timeoutId);
          
          console.log('📡 tRPC response:', { 
            status: response.status, 
            statusText: response.statusText,
            contentType: response.headers.get('content-type')
          });
          
          if (!response.ok) {
            const contentType = response.headers.get('content-type');
            let errorText = 'Unknown error';
            
            try {
              if (contentType?.includes('application/json')) {
                const errorData = await response.json();
                errorText = errorData.message || JSON.stringify(errorData);
              } else {
                errorText = await response.text();
              }
            } catch (parseError) {
              console.warn('⚠️ Failed to parse error response:', parseError);
              errorText = `HTTP ${response.status} ${response.statusText}`;
            }
            
            console.error('❌ tRPC error response:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }
          
          // Validate response is JSON
          const contentType = response.headers.get('content-type');
          if (!contentType?.includes('application/json')) {
            const text = await response.text();
            console.error('❌ tRPC received non-JSON response:', text.substring(0, 200));
            throw new Error('Server returned non-JSON response');
          }
          
          return response;
        } catch (error) {
          clearTimeout(timeoutId);
          
          if (error instanceof Error && error.name === 'AbortError') {
            console.error('❌ tRPC request timeout');
            throw new Error('Request timeout - server may be unavailable');
          }
          
          console.error('❌ tRPC fetch error:', error);
          throw error;
        }
      },
    }),
  ],
});