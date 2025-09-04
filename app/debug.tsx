import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '@/constants/theme';
import { RefreshCw, Trash2, Database, AlertTriangle } from 'lucide-react-native';

interface DebugInfo {
  storageSize: string;
  projectCount: number;
  hasCorruptedData: boolean;
  lastError?: string;
}

export default function DebugScreen() {
  const router = useRouter();
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);

  const loadDebugInfo = async () => {
    try {
      setIsLoading(true);
      const stored = await AsyncStorage.getItem('homeslam_projects');
      
      let info: DebugInfo = {
        storageSize: '0 KB',
        projectCount: 0,
        hasCorruptedData: false,
      };

      if (stored) {
        info.storageSize = `${Math.round(stored.length / 1024)} KB`;
        
        try {
          const projects = JSON.parse(stored);
          if (Array.isArray(projects)) {
            info.projectCount = projects.length;
          } else {
            info.hasCorruptedData = true;
            info.lastError = 'Data is not an array';
          }
        } catch (parseError) {
          info.hasCorruptedData = true;
          info.lastError = `Parse error: ${parseError}`;
        }
      }

      setDebugInfo(info);
    } catch (error) {
      console.error('Error loading debug info:', error);
      setDebugInfo({
        storageSize: 'Unknown',
        projectCount: 0,
        hasCorruptedData: true,
        lastError: `Debug error: ${error}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearStorage = async () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your projects, expenses, and change orders. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsClearing(true);
              await AsyncStorage.removeItem('homeslam_projects');
              Alert.alert('Success', 'All data has been cleared. The app should work normally now.');
              await loadDebugInfo();
            } catch (error) {
              Alert.alert('Error', `Failed to clear data: ${error}`);
            } finally {
              setIsClearing(false);
            }
          },
        },
      ]
    );
  };

  const goHome = () => {
    router.replace('/(tabs)');
  };

  useEffect(() => {
    loadDebugInfo();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.secondary} />
        <Text style={styles.loadingText}>Loading debug information...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <AlertTriangle size={32} color={theme.colors.warning} />
        <Text style={styles.title}>Debug & Recovery</Text>
        <Text style={styles.subtitle}>
          Use this screen to diagnose and fix app issues
        </Text>
      </View>

      {debugInfo && (
        <View style={styles.infoContainer}>
          <Text style={styles.sectionTitle}>Storage Information</Text>
          
          <View style={styles.infoRow}>
            <Database size={20} color={theme.colors.text} />
            <Text style={styles.infoLabel}>Storage Size:</Text>
            <Text style={styles.infoValue}>{debugInfo.storageSize}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Database size={20} color={theme.colors.text} />
            <Text style={styles.infoLabel}>Project Count:</Text>
            <Text style={styles.infoValue}>{debugInfo.projectCount}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <AlertTriangle 
              size={20} 
              color={debugInfo.hasCorruptedData ? theme.colors.error : theme.colors.success} 
            />
            <Text style={styles.infoLabel}>Data Status:</Text>
            <Text style={[
              styles.infoValue,
              { color: debugInfo.hasCorruptedData ? theme.colors.error : theme.colors.success }
            ]}>
              {debugInfo.hasCorruptedData ? 'Corrupted' : 'Healthy'}
            </Text>
          </View>
          
          {debugInfo.lastError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorTitle}>Last Error:</Text>
              <Text style={styles.errorText}>{debugInfo.lastError}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Recovery Actions</Text>
        
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={loadDebugInfo}
          disabled={isLoading}
        >
          <RefreshCw size={20} color={theme.colors.secondary} />
          <Text style={styles.actionButtonText}>Refresh Debug Info</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.dangerButton]} 
          onPress={clearStorage}
          disabled={isClearing}
        >
          <Trash2 size={20} color={theme.colors.surface} />
          <Text style={[styles.actionButtonText, styles.dangerButtonText]}>
            {isClearing ? 'Clearing...' : 'Clear All Data'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.primaryButton]} 
          onPress={goHome}
        >
          <Text style={[styles.actionButtonText, styles.primaryButtonText]}>Try App Again</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.instructionsContainer}>
        <Text style={styles.sectionTitle}>Instructions</Text>
        <Text style={styles.instructionText}>
          1. If data is corrupted, try &quot;Clear All Data&quot; to reset the app
        </Text>
        <Text style={styles.instructionText}>
          2. After clearing data, tap &quot;Try App Again&quot; to return to the main app
        </Text>
        <Text style={styles.instructionText}>
          3. If issues persist, restart the app completely
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.text,
  },
  header: {
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: theme.colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  infoContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: theme.colors.text,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: theme.colors.text,
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: theme.colors.text,
  },
  errorContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: theme.colors.error + '10',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.error + '30',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: theme.colors.error,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.error,
    fontFamily: 'monospace',
  },
  actionsContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.secondary,
    marginBottom: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: theme.colors.primary,
  },
  dangerButton: {
    backgroundColor: theme.colors.error,
  },
  dangerButtonText: {
    color: theme.colors.surface,
  },
  primaryButton: {
    backgroundColor: theme.colors.success,
  },
  primaryButtonText: {
    color: theme.colors.surface,
  },
  instructionsContainer: {
    padding: 20,
  },
  instructionText: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 8,
    lineHeight: 20,
  },
});