import { createTRPCReact } from "@trpc/react-query";
import { httpLink, createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  // For web environment - use current origin
  if (typeof window !== 'undefined') {
    console.log('🌐 Web environment detected, using:', window.location.origin);
    return window.location.origin;
  }
  
  // For mobile environment - try to get the development server URL from Expo
  // Check various environment variables that Expo might set
  const possibleUrls = [
    process.env.EXPO_PUBLIC_API_URL,
    process.env.EXPO_PUBLIC_DEV_SERVER_URL,
    process.env.EXPO_DEV_SERVER_URL,
  ].filter(Boolean);
  
  if (possibleUrls.length > 0) {
    const url = possibleUrls[0];
    console.log('📱 Mobile environment detected, using:', url);
    return url;
  }
  
  // Final fallback - localhost
  const fallbackUrl = 'http://localhost:8081';
  console.log('🔄 Using fallback URL:', fallbackUrl);
  return fallbackUrl;
};

const baseUrl = getBaseUrl();
const trpcUrl = `${baseUrl}/api/trpc`;

console.log('🔗 tRPC client configuration:', {
  baseUrl,
  trpcUrl,
  environment: typeof window !== 'undefined' ? 'web' : 'mobile'
});

// Custom fetch function with enhanced error handling
const customFetch = async (url: URL | RequestInfo, options?: RequestInit) => {
  const urlString = typeof url === 'string' ? url : url.toString();
  console.log('📡 tRPC request:', { url: urlString, method: options?.method });
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options?.headers,
      },
    });
    
    clearTimeout(timeoutId);
    
    console.log('📡 tRPC response:', { 
      status: response.status, 
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
      url: response.url
    });
    
    // Check if we got an HTML response (likely a 404 or server error page)
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      const htmlText = await response.text();
      console.error('❌ Received HTML instead of JSON:', {
        status: response.status,
        url: response.url,
        contentType,
        htmlPreview: htmlText.substring(0, 200)
      });
      
      if (response.status === 404) {
        throw new Error('Backend API not found - server may not be running');
      } else {
        throw new Error(`Server returned HTML instead of JSON (${response.status})`);
      }
    }
    
    if (!response.ok) {
      let errorText = 'Unknown error';
      
      try {
        if (contentType.includes('application/json')) {
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
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      console.error('❌ tRPC received non-JSON response:', {
        contentType,
        textPreview: text.substring(0, 200)
      });
      throw new Error('Server returned non-JSON response');
    }
    
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('❌ tRPC request timeout');
      throw new Error('Request timeout - server may be unavailable');
    }
    
    // Network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('❌ Network error - backend may be down:', error.message);
      throw new Error('Network error - cannot reach backend server');
    }
    
    console.error('❌ tRPC fetch error:', error);
    throw error;
  }
};

// Create the tRPC client for React components
export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: trpcUrl,
      transformer: superjson,
      fetch: customFetch,
      headers: () => ({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }),
    }),
  ],
});

// Create a vanilla client for use outside React components
export const vanillaTrpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: trpcUrl,
      transformer: superjson,
      fetch: customFetch,
      headers: () => ({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }),
    }),
  ],
});