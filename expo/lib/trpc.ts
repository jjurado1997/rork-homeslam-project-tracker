import { createTRPCReact } from "@trpc/react-query";
import { httpLink, createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

// Function to test if a URL is reachable and returns JSON
const testBackendUrl = async (url: string): Promise<boolean> => {
  try {
    console.log('🧪 Testing backend URL:', url);
    const response = await fetch(`${url}/api`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      signal: (() => {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 3000);
        return controller.signal;
      })()
    });
    
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    
    console.log('🧪 Test result for', url, ':', {
      status: response.status,
      contentType,
      isJson,
      ok: response.ok
    });
    
    return response.ok && isJson;
  } catch (error) {
    console.log('🧪 Test failed for', url, ':', error);
    return false;
  }
};

const getBaseUrl = async (): Promise<string> => {
  // For web environment - use current origin
  if (typeof window !== 'undefined') {
    console.log('🌐 Web environment detected, using:', window.location.origin);
    return window.location.origin;
  }
  
  // Build list of possible URLs to try
  const candidateUrls: string[] = [];
  
  // Add environment variables
  const envUrls = [
    process.env.EXPO_PUBLIC_API_URL,
    process.env.EXPO_PUBLIC_DEV_SERVER_URL,
    process.env.EXPO_DEV_SERVER_URL,
  ].filter(Boolean) as string[];
  candidateUrls.push(...envUrls);
  
  // Try to detect from current URL in development
  if (typeof global !== 'undefined' && (global as any).__DEV__) {
    try {
      const currentUrl = (global as any).location?.href;
      if (currentUrl && typeof currentUrl === 'string') {
        console.log('🔍 Current URL detected:', currentUrl);
        const match = currentUrl.match(/https?:\/\/([^/:]+)/);
        if (match && match[1]) {
          const host = match[1];
          const backendUrl = `http://${host.replace(/:\d+$/, ':8081')}`;
          candidateUrls.push(backendUrl);
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to detect from current URL:', error);
    }
  }
  
  // Add common development URLs
  candidateUrls.push(
    'http://localhost:8081',
    'http://127.0.0.1:8081',
    'http://192.168.1.100:8081', // Common local network IP
    'http://10.0.0.100:8081',    // Another common local network IP
  );
  
  // Remove duplicates
  const uniqueUrls = [...new Set(candidateUrls)];
  
  console.log('🔍 Testing candidate URLs:', uniqueUrls);
  
  // Test each URL and return the first working one
  for (const url of uniqueUrls) {
    const isWorking = await testBackendUrl(url);
    if (isWorking) {
      console.log('✅ Found working backend URL:', url);
      return url;
    }
  }
  
  // If no URL works, return localhost as fallback
  const fallbackUrl = 'http://localhost:8081';
  console.log('🔄 No working backend found, using fallback:', fallbackUrl);
  return fallbackUrl;
};

// Synchronous version for immediate use
const getBaseUrlSync = () => {
  // For web environment - use current origin
  if (typeof window !== 'undefined') {
    console.log('🌐 Web environment detected, using:', window.location.origin);
    return window.location.origin;
  }
  
  // For mobile environment - try to get the development server URL from Expo
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
  
  // Try to detect from current URL in development
  if (typeof global !== 'undefined' && (global as any).__DEV__) {
    try {
      const currentUrl = (global as any).location?.href;
      if (currentUrl && typeof currentUrl === 'string') {
        console.log('🔍 Current URL detected:', currentUrl);
        const match = currentUrl.match(/https?:\/\/([^/:]+)/);
        if (match && match[1]) {
          const host = match[1];
          const backendUrl = `http://${host.replace(/:\d+$/, ':8081')}`;
          console.log('📱 Expo tunnel detected, using backend URL:', backendUrl);
          return backendUrl;
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to detect Expo tunnel URL:', error);
    }
  }
  
  // Final fallback - localhost
  const fallbackUrl = 'http://localhost:8081';
  console.log('🔄 Using fallback URL:', fallbackUrl);
  return fallbackUrl;
};

// Use sync version for initial setup, async version will be used later for testing
const baseUrl = getBaseUrlSync();
const trpcUrl = `${baseUrl}/api/trpc`;

console.log('🔗 tRPC client configuration:', {
  baseUrl,
  trpcUrl,
  environment: typeof window !== 'undefined' ? 'web' : 'mobile'
});

// Test and potentially update the URL asynchronously
if (typeof window === 'undefined') {
  // Only do this for mobile (non-web) environments
  getBaseUrl().then((testedUrl) => {
    if (testedUrl !== baseUrl) {
      console.log('🔄 Backend URL updated after testing:', testedUrl);
      // Note: This won't update existing clients, but will help with debugging
    }
  }).catch((error) => {
    console.warn('⚠️ Failed to test backend URLs:', error);
  });
}

// Custom fetch function with enhanced error handling
const customFetch = async (url: URL | RequestInfo, options?: RequestInit) => {
  const urlString = typeof url === 'string' ? url : url.toString();
  console.log('📡 tRPC request:', { url: urlString, method: options?.method });
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
  
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
        throw new Error('Backend server not running - start the backend server');
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