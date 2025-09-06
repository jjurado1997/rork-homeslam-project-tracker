import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';

export default function BackendTestScreen() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    
    const possibleUrls = [
      process.env.EXPO_PUBLIC_API_URL,
      process.env.EXPO_PUBLIC_DEV_SERVER_URL,
      process.env.EXPO_DEV_SERVER_URL,
    ].filter(Boolean);
    
    if (possibleUrls.length > 0) {
      return possibleUrls[0];
    }
    
    return 'http://localhost:8081';
  };

  const testHealthEndpoint = async () => {
    setIsLoading(true);
    addResult('Testing health endpoint...');
    
    try {
      const baseUrl = getBaseUrl();
      const healthUrl = `${baseUrl}/api`;
      addResult(`Base URL detected: ${baseUrl}`);
      
      addResult(`Fetching: ${healthUrl}`);
      
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      addResult(`Response status: ${response.status} ${response.statusText}`);
      addResult(`Content-Type: ${response.headers.get('content-type')}`);
      
      const text = await response.text();
      addResult(`Response body: ${text.substring(0, 200)}`);
      
      if (response.ok) {
        try {
          const data = JSON.parse(text);
          addResult(`✅ Health check successful: ${data.message}`);
        } catch {
          addResult(`⚠️ Health endpoint returned non-JSON: ${text}`);
        }
      } else {
        addResult(`❌ Health check failed: ${response.status}`);
      }
    } catch (error) {
      addResult(`❌ Health check error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testTrpcEndpoint = async () => {
    setIsLoading(true);
    addResult('Testing tRPC endpoint...');
    
    try {
      const baseUrl = getBaseUrl();
      const trpcUrl = `${baseUrl}/api/trpc/projects.getAll`;
      addResult(`Base URL detected: ${baseUrl}`);
      
      addResult(`Fetching: ${trpcUrl}`);
      
      const response = await fetch(trpcUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      addResult(`Response status: ${response.status} ${response.statusText}`);
      addResult(`Content-Type: ${response.headers.get('content-type')}`);
      
      const text = await response.text();
      addResult(`Response body: ${text.substring(0, 200)}`);
      
      if (response.ok) {
        try {
          JSON.parse(text);
          addResult(`✅ tRPC endpoint successful`);
        } catch {
          addResult(`⚠️ tRPC endpoint returned non-JSON: ${text}`);
        }
      } else {
        addResult(`❌ tRPC endpoint failed: ${response.status}`);
      }
    } catch (error) {
      addResult(`❌ tRPC endpoint error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testTrpcClient = async () => {
    setIsLoading(true);
    addResult('Testing tRPC client...');
    
    try {
      // Import vanilla tRPC client for direct calls
      const { vanillaTrpcClient } = await import('@/lib/trpc');
      const result = await vanillaTrpcClient.example.hi.query.query();
      addResult(`✅ tRPC client successful: ${JSON.stringify(result)}`);
    } catch (error: any) {
      addResult(`❌ tRPC client error: ${error?.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testProjectsQuery = async () => {
    setIsLoading(true);
    addResult('Testing projects query...');
    
    try {
      const { vanillaTrpcClient } = await import('@/lib/trpc');
      const result = await vanillaTrpcClient.projects.getAll.query();
      addResult(`✅ Projects query successful: ${result.length} projects`);
    } catch (error: any) {
      addResult(`❌ Projects query error: ${error?.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Backend Connection Test</Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
            onPress={testHealthEndpoint}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Test Health Endpoint</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
            onPress={testTrpcEndpoint}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Test tRPC Endpoint</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
            onPress={testTrpcClient}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Test tRPC Client</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
            onPress={testProjectsQuery}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Test Projects Query</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.clearButton]} 
            onPress={clearResults}
          >
            <Text style={styles.clearButtonText}>Clear Results</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Test Results:</Text>
          {testResults.map((result, index) => (
            <Text key={index} style={styles.resultText}>{result}</Text>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: theme.colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonContainer: {
    marginBottom: 24,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: theme.colors.textLight,
    opacity: 0.6,
  },
  buttonText: {
    color: theme.colors.surface,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  clearButton: {
    backgroundColor: theme.colors.error,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: theme.colors.surface,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  resultsContainer: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 8,
    minHeight: 200,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: theme.colors.text,
    marginBottom: 12,
  },
  resultText: {
    fontSize: 12,
    color: theme.colors.text,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});