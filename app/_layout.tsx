import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, Component, ReactNode } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { ProjectProvider } from "@/hooks/project-store";
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
    console.error('Error caught by boundary:', error, errorInfo);
    // Try to clear potentially corrupted data
    AsyncStorage.removeItem('homeslam_projects').catch(console.error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.title}>App Crashed</Text>
          <Text style={errorStyles.message}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <TouchableOpacity 
            style={errorStyles.button}
            onPress={async () => {
              try {
                await AsyncStorage.removeItem('homeslam_projects');
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
          {__DEV__ && (
            <Text style={errorStyles.debugText}>
              {this.state.error?.stack}
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
      retry: 1,
      retryDelay: 500,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
    mutations: {
      retry: 1,
      retryDelay: 500,
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
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Initializing app...');
        // Add a small delay to ensure everything is ready
        setTimeout(async () => {
          await SplashScreen.hideAsync();
          console.log('✅ App initialized successfully');
        }, 100);
      } catch (error) {
        console.error('❌ Error initializing app:', error);
        // Still hide splash screen even if there's an error
        setTimeout(() => SplashScreen.hideAsync(), 500);
      }
    };
    
    initializeApp();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ProjectProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <RootLayoutNav />
          </GestureHandlerRootView>
        </ProjectProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}