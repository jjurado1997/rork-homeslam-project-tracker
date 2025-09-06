import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState, Component, ReactNode } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { ProjectProvider } from "@/hooks/project-store";
import { trpc, trpcClient } from "@/lib/trpc";
import { theme } from "@/constants/theme";
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('💥 Error caught by boundary:', error, errorInfo);
    console.error('📍 Component stack:', errorInfo.componentStack);
    console.error('📍 Error name:', error.name);
    console.error('📍 Error message:', error.message);
    console.error('📍 Error stack:', error.stack);
    
    // Don't automatically clear data - let user decide
    console.log('🔧 Error boundary activated - user can clear data manually if needed');
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.title}>Something went wrong</Text>
          <Text style={errorStyles.message}>
            The app encountered an error. Try clearing the data to fix it.
          </Text>
          <TouchableOpacity 
            style={errorStyles.button}
            onPress={async () => {
              try {
                await AsyncStorage.removeItem('homeslam_projects');
                await AsyncStorage.removeItem('homeslam_projects_backup');
                console.log('✅ Storage cleared successfully');
                this.setState({ hasError: false, error: undefined });
              } catch (clearError) {
                console.error('❌ Failed to clear storage:', clearError);
                // Still try to reset the error state
                this.setState({ hasError: false, error: undefined });
              }
            }}
          >
            <Text style={errorStyles.buttonText}>Clear Data & Restart</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[errorStyles.button, { backgroundColor: theme.colors.secondary }]}
            onPress={() => {
              this.setState({ hasError: false, error: undefined });
            }}
          >
            <Text style={errorStyles.buttonText}>Try Again</Text>
          </TouchableOpacity>
          {__DEV__ && (
            <Text style={errorStyles.debugText}>
              Error: {this.state.error?.message}
            </Text>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: theme.colors.error,
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: theme.colors.error,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  buttonText: {
    color: theme.colors.surface,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  debugText: {
    fontSize: 12,
    color: theme.colors.textLight,
    textAlign: 'center',
    fontFamily: 'monospace',
    marginTop: 16,
  },
});

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on certain errors
        if (error?.message?.includes('JSON Parse error') || 
            error?.message?.includes('Server returned non-JSON response')) {
          return false;
        }
        return failureCount < 2; // Retry up to 2 times
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry mutations on parse errors
        if (error?.message?.includes('JSON Parse error') || 
            error?.message?.includes('Server returned non-JSON response')) {
          return false;
        }
        return failureCount < 1; // Retry once for mutations
      },
      retryDelay: 1000,
      networkMode: 'offlineFirst',
    },
  },
});

function RootLayoutNav() {
  return (
    <Stack 
      screenOptions={{ 
        headerBackTitle: "Back",
        headerStyle: {
          backgroundColor: theme.colors.headerBackground,
        },
        headerTintColor: theme.colors.secondary,
        headerTitleStyle: {
          fontWeight: 'bold' as const,
        },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="project/[id]" 
        options={{ 
          title: "Project Details",
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="add-project" 
        options={{ 
          title: "New Project",
          presentation: 'modal',
        }} 
      />
      <Stack.Screen 
        name="add-expense" 
        options={{ 
          title: "Add Expense",
          presentation: 'modal',
        }} 
      />
      <Stack.Screen 
        name="edit-expense" 
        options={{ 
          title: "Edit Expense",
          presentation: 'modal',
        }} 
      />
      <Stack.Screen 
        name="edit-project" 
        options={{ 
          title: "Edit Project",
          presentation: 'modal',
        }} 
      />
      <Stack.Screen 
        name="add-change-order" 
        options={{ 
          title: "Add Change Order",
          presentation: 'modal',
        }} 
      />
      <Stack.Screen 
        name="debug" 
        options={{ 
          title: "Debug & Recovery",
          presentation: 'modal',
        }} 
      />
      <Stack.Screen 
        name="backend-test" 
        options={{ 
          title: "Backend Test",
          presentation: 'modal',
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Initializing app...');
        
        // Force hide splash screen after a maximum timeout
        const forceHideTimeout = setTimeout(() => {
          console.log('⏰ Force hiding splash screen after timeout');
          SplashScreen.hideAsync().catch(e => console.warn('⚠️ Force hide failed:', e));
          setIsInitialized(true);
        }, 3000); // 3 second maximum
        
        // Normal initialization
        setTimeout(async () => {
          try {
            await SplashScreen.hideAsync();
            console.log('✅ App initialized successfully');
            clearTimeout(forceHideTimeout);
            setIsInitialized(true);
          } catch (splashError) {
            console.warn('⚠️ Splash screen error (non-critical):', splashError);
            setIsInitialized(true);
          }
        }, 50);
      } catch (error) {
        console.error('❌ Error initializing app:', error);
        setInitError(String(error));
        
        // Force hide splash screen after short delay
        setTimeout(() => {
          try {
            SplashScreen.hideAsync();
            setIsInitialized(true);
          } catch (splashError) {
            console.warn('⚠️ Failed to hide splash screen:', splashError);
            setIsInitialized(true);
          }
        }, 200);
      }
    };
    
    initializeApp();
  }, []);

  // Show loading screen while initializing
  if (!isInitialized) {
    return (
      <View style={errorStyles.container}>
        <Text style={errorStyles.message}>Starting app...</Text>
        {initError && (
          <Text style={errorStyles.debugText}>Error: {initError}</Text>
        )}
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <ProjectProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <RootLayoutNav />
            </GestureHandlerRootView>
          </ProjectProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </ErrorBoundary>
  );
}