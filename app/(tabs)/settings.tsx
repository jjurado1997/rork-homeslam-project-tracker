import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Trash2, Download, Upload, Info, Shield, Bell } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { useProjects } from '@/hooks/project-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const { allProjects } = useProjects();

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all projects and expenses. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            Alert.alert('Success', 'All data has been cleared.');
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert('Export Data', 'Export functionality will be available in a future update.');
  };

  const handleImportData = () => {
    Alert.alert('Import Data', 'Import functionality will be available in a future update.');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        
        <TouchableOpacity style={styles.settingItem} onPress={handleExportData}>
          <Download size={20} color={theme.colors.primary} />
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Export Data</Text>
            <Text style={styles.settingDescription}>Download all projects and expenses</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handleImportData}>
          <Upload size={20} color={theme.colors.primary} />
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Import Data</Text>
            <Text style={styles.settingDescription}>Restore from backup</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.settingItem, styles.dangerItem]} onPress={handleClearData}>
          <Trash2 size={20} color={theme.colors.error} />
          <View style={styles.settingContent}>
            <Text style={[styles.settingLabel, styles.dangerText]}>Clear All Data</Text>
            <Text style={styles.settingDescription}>Delete all projects permanently</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        
        <TouchableOpacity style={styles.settingItem}>
          <Bell size={20} color={theme.colors.primary} />
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Notifications</Text>
            <Text style={styles.settingDescription}>Coming soon</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <Shield size={20} color={theme.colors.primary} />
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Privacy</Text>
            <Text style={styles.settingDescription}>Data is stored locally on device</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        
        <View style={styles.aboutCard}>
          <Info size={20} color={theme.colors.secondary} />
          <View style={styles.aboutContent}>
            <Text style={styles.aboutTitle}>Home Slam Inc.</Text>
            <Text style={styles.aboutText}>Project Management System</Text>
            <Text style={styles.aboutVersion}>Version 1.0.0</Text>
          </View>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Statistics</Text>
          <Text style={styles.statsText}>Total Projects: {allProjects.length}</Text>
          <Text style={styles.statsText}>
            Active Projects: {allProjects.filter(p => !p.isCompleted).length}
          </Text>
          <Text style={styles.statsText}>
            Completed Projects: {allProjects.filter(p => p.isCompleted).length}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  section: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600' as const,
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  dangerItem: {
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: '500' as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  settingDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
  },
  dangerText: {
    color: theme.colors.error,
  },
  aboutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  aboutContent: {
    flex: 1,
  },
  aboutTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600' as const,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  aboutText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
  },
  aboutVersion: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textLight,
    marginTop: theme.spacing.xs,
  },
  statsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  statsTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '600' as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  statsText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
});