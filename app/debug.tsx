import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '@/constants/theme';
import { RefreshCw, Trash2, Database, AlertTriangle, Download, Upload, Copy } from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { useProjects } from '@/hooks/project-store';

interface DebugInfo {
  storageSize: string;
  projectCount: number;
  hasCorruptedData: boolean;
  lastError?: string;
  rawData?: string;
}

interface BackupData {
  version: string;
  timestamp: string;
  projects: any[];
}

export default function DebugScreen() {
  const router = useRouter();
  const { allProjects } = useProjects();
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importDataText, setImportDataText] = useState('');
  const [showImportInput, setShowImportInput] = useState(false);

  const loadDebugInfo = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Debug: Checking AsyncStorage for data...');
      
      // Check all possible storage keys that might have been used
      const possibleKeys = [
        'homeslam_projects',
        'projects', 
        'HomeSlam_projects',
        'homeslam_data',
        'app_data'
      ];
      
      let foundData = null;
      let foundKey = null;
      
      for (const key of possibleKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          console.log(`🎯 Found data in key: ${key}`);
          foundData = data;
          foundKey = key;
          break;
        }
      }
      
      // Also check all keys in AsyncStorage
      const allKeys = await AsyncStorage.getAllKeys();
      console.log('📋 All AsyncStorage keys:', allKeys);
      
      let info: DebugInfo = {
        storageSize: '0 KB',
        projectCount: 0,
        hasCorruptedData: false,
      };

      if (foundData) {
        console.log(`📦 Found data in ${foundKey}, size: ${foundData.length} chars`);
        info.storageSize = `${Math.round(foundData.length / 1024)} KB`;
        info.rawData = foundData;
        info.lastError = foundKey !== 'homeslam_projects' ? `Data found in different key: ${foundKey}` : undefined;
        
        try {
          const projects = JSON.parse(foundData);
          if (Array.isArray(projects)) {
            info.projectCount = projects.length;
            console.log(`✅ Found ${projects.length} projects in ${foundKey}`);
            
            // If data is in wrong key, migrate it
            if (foundKey !== 'homeslam_projects' && foundKey) {
              console.log(`🔄 Migrating data from ${foundKey} to homeslam_projects`);
              await AsyncStorage.setItem('homeslam_projects', foundData);
              await AsyncStorage.removeItem(foundKey);
              info.lastError = `Data migrated from ${foundKey} to correct location`;
            }
          } else {
            info.hasCorruptedData = true;
            info.lastError = 'Data is not an array';
          }
        } catch (parseError) {
          info.hasCorruptedData = true;
          info.lastError = `Parse error: ${parseError}`;
        }
      } else {
        console.log('❌ No project data found in any storage key');
        info.lastError = `No data found. Checked keys: ${possibleKeys.join(', ')}. All keys: ${allKeys.join(', ')}`;
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

  const exportData = async () => {
    try {
      setIsExporting(true);
      
      const backupData: BackupData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        projects: allProjects
      };
      
      const jsonString = JSON.stringify(backupData, null, 2);
      
      if (Platform.OS === 'web') {
        // Web: Copy to clipboard
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(jsonString);
          Alert.alert('Success', 'Backup data copied to clipboard! Save it somewhere safe.');
        } else {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = jsonString;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          Alert.alert('Success', 'Backup data copied to clipboard! Save it somewhere safe.');
        }
      } else {
        // Mobile: Save to file and share
        const fileName = `homeslam_backup_${new Date().toISOString().split('T')[0]}.json`;
        const fileUri = FileSystem.documentDirectory + fileName;
        
        await FileSystem.writeAsStringAsync(fileUri, jsonString);
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/json',
            dialogTitle: 'Save your HomeSlam backup'
          });
        } else {
          Alert.alert('Success', `Backup saved to: ${fileUri}`);
        }
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', `Failed to export data: ${error}`);
    } finally {
      setIsExporting(false);
    }
  };
  
  const importData = async () => {
    if (!importDataText.trim()) {
      Alert.alert('Error', 'Please paste your backup data first.');
      return;
    }
    
    try {
      setIsImporting(true);
      
      const parsed = JSON.parse(importDataText.trim());
      
      // Validate backup format
      if (!parsed.projects || !Array.isArray(parsed.projects)) {
        throw new Error('Invalid backup format: missing projects array');
      }
      
      // Save the imported projects
      await AsyncStorage.setItem('homeslam_projects', JSON.stringify(parsed.projects));
      
      Alert.alert(
        'Success!', 
        `Imported ${parsed.projects.length} projects successfully! The app will refresh now.`,
        [{
          text: 'OK',
          onPress: () => {
            setShowImportInput(false);
            setImportDataText('');
            loadDebugInfo();
            // Force app to refresh by going home
            router.replace('/(tabs)');
          }
        }]
      );
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Error', `Failed to import data: ${error}`);
    } finally {
      setIsImporting(false);
    }
  };
  
  const copyRawData = async () => {
    if (!debugInfo?.rawData) {
      Alert.alert('Error', 'No raw data available to copy.');
      return;
    }
    
    try {
      if (Platform.OS === 'web') {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(debugInfo.rawData);
        } else {
          const textArea = document.createElement('textarea');
          textArea.value = debugInfo.rawData;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }
      }
      Alert.alert('Success', 'Raw data copied to clipboard!');
    } catch (error) {
      Alert.alert('Error', `Failed to copy data: ${error}`);
    }
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
          style={styles.actionButton} 
          onPress={exportData}
          disabled={isExporting}
        >
          <Download size={20} color={theme.colors.secondary} />
          <Text style={styles.actionButtonText}>
            {isExporting ? 'Exporting...' : 'Export/Backup Data'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => setShowImportInput(!showImportInput)}
        >
          <Upload size={20} color={theme.colors.secondary} />
          <Text style={styles.actionButtonText}>Import/Restore Data</Text>
        </TouchableOpacity>
        
        {debugInfo?.rawData && (
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={copyRawData}
          >
            <Copy size={20} color={theme.colors.secondary} />
            <Text style={styles.actionButtonText}>Copy Raw Data</Text>
          </TouchableOpacity>
        )}
        
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

      {showImportInput && (
        <View style={styles.importContainer}>
          <Text style={styles.sectionTitle}>Import Backup Data</Text>
          <Text style={styles.instructionText}>
            Paste your backup data below and tap &quot;Import Data&quot;:
          </Text>
          <TextInput
            style={styles.importInput}
            multiline
            numberOfLines={6}
            value={importDataText}
            onChangeText={setImportDataText}
            placeholder="Paste your backup JSON data here..."
            placeholderTextColor={theme.colors.textLight}
          />
          <TouchableOpacity 
            style={[styles.actionButton, styles.successButton]} 
            onPress={importData}
            disabled={isImporting || !importDataText.trim()}
          >
            <Upload size={20} color={theme.colors.surface} />
            <Text style={[styles.actionButtonText, styles.successButtonText]}>
              {isImporting ? 'Importing...' : 'Import Data'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.instructionsContainer}>
        <Text style={styles.sectionTitle}>Data Recovery Instructions</Text>
        <Text style={styles.warningText}>
          ⚠️ IMPORTANT: This app stores data locally on each device. Data is NOT synced to the cloud.
        </Text>
        <Text style={styles.instructionText}>
          <Text style={styles.boldText}>To recover your data:</Text>
        </Text>
        <Text style={styles.instructionText}>
          1. If you have a backup file, use &quot;Import/Restore Data&quot; above
        </Text>
        <Text style={styles.instructionText}>
          2. If you&apos;re on a different device, your data won&apos;t be there
        </Text>
        <Text style={styles.instructionText}>
          3. Check the original device where you entered the data
        </Text>
        <Text style={styles.instructionText}>
          <Text style={styles.boldText}>To prevent future data loss:</Text>
        </Text>
        <Text style={styles.instructionText}>
          1. Use &quot;Export/Backup Data&quot; regularly to save your projects
        </Text>
        <Text style={styles.instructionText}>
          2. Save the backup file to cloud storage (Google Drive, iCloud, etc.)
        </Text>
        <Text style={styles.instructionText}>
          3. Import the backup on any new device to restore your data
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
  successButton: {
    backgroundColor: theme.colors.success,
  },
  successButtonText: {
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
  warningText: {
    fontSize: 14,
    color: theme.colors.warning,
    marginBottom: 12,
    lineHeight: 20,
    fontWeight: '600' as const,
    backgroundColor: theme.colors.warning + '10',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.warning + '30',
  },
  boldText: {
    fontWeight: '600' as const,
    color: theme.colors.text,
  },
  importContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  importInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
    marginBottom: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
});