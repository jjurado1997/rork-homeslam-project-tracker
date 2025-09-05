import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Settings, Wifi, WifiOff, Clock, AlertTriangle } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { useProjects } from '@/hooks/project-store';
import { ProjectCard } from '@/components/ProjectCard';
import { FilterBar } from '@/components/FilterBar';
import { StatsOverview } from '@/components/StatsOverview';

export default function ProjectsScreen() {
  const router = useRouter();
  const { 
    projects, 
    allProjects, 
    isLoading, 
    error, 
    isOnline, 
    lastSyncTime
  } = useProjects();
  
  // Debug logging
  console.log('🏠 ProjectsScreen render:', {
    isLoading,
    error: error ? String(error) : null,
    isOnline,
    projectsCount: projects.length,
    allProjectsCount: allProjects.length,
    projectNames: projects.map(p => p.name)
  });

  const handleAddProject = () => {
    router.push('/add-project');
  };



  // Add timeout for loading state to prevent infinite loading
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log('⏰ Loading timeout reached, forcing app to show content');
      }
    }, 5000); // 5 second timeout
    
    return () => clearTimeout(timeout);
  }, [isLoading]);

  if (isLoading && isOnline) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.secondary} />
        <Text style={styles.loadingText}>Loading from server...</Text>
        <TouchableOpacity 
          style={styles.skipLoadingButton} 
          onPress={() => router.replace('/debug')}
        >
          <Text style={styles.skipLoadingText}>Having trouble? Tap here</Text>
        </TouchableOpacity>
      </View>
    );
  }



  return (
    <View style={styles.container}>
      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProjectCard project={item} />}
        ListHeaderComponent={
          <>
            <View style={styles.statusHeader}>
              <View style={styles.statusContainer}>
                {isOnline ? (
                  <View style={styles.onlineStatus}>
                    <Wifi size={16} color={theme.colors.success} />
                    <Text style={styles.onlineText}>Online & Synced</Text>
                  </View>
                ) : (
                  <View style={styles.offlineStatus}>
                    <WifiOff size={16} color={theme.colors.warning} />
                    <Text style={styles.offlineText}>Offline Mode</Text>
                  </View>
                )}
                {lastSyncTime && (
                  <View style={styles.syncStatus}>
                    <Clock size={12} color={theme.colors.textLight} />
                    <Text style={styles.syncText}>
                      Last sync: {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                )}
              </View>
              {!isOnline && (
                <View style={styles.offlineNotice}>
                  <AlertTriangle size={16} color={theme.colors.warning} />
                  <Text style={styles.offlineNoticeText}>
                    Changes will sync when connection is restored
                  </Text>
                </View>
              )}
            </View>
            <StatsOverview />
            <FilterBar />
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No projects found</Text>
            <Text style={styles.emptyText}>
              {allProjects.length > 0 
                ? `${allProjects.length} projects exist but none match current filters`
                : 'Tap the + button to create your first project'
              }
            </Text>
            {__DEV__ && (
              <Text style={styles.debugText}>
                Debug: Loading={isLoading ? 'true' : 'false'}, 
                All={allProjects.length}, Filtered={projects.length}
              </Text>
            )}
          </View>
        }
        contentContainerStyle={projects.length === 0 ? styles.emptyList : undefined}
      />

      <TouchableOpacity 
        style={styles.fab} 
        onPress={handleAddProject}
        activeOpacity={0.8}
      >
        <Plus size={28} color={theme.colors.primary} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.debugFab} 
        onPress={() => router.push('/debug')}
        activeOpacity={0.8}
      >
        <Settings size={24} color={theme.colors.primary} />
      </TouchableOpacity>
    </View>
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

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background,
  },
  errorTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: '600' as const,
    color: theme.colors.error,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
  },
  recoveryButton: {
    backgroundColor: theme.colors.error,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: 8,
    marginBottom: theme.spacing.md,
  },
  recoveryButtonText: {
    color: theme.colors.surface,
    fontSize: theme.fontSize.md,
    fontWeight: '600' as const,
  },
  debugButton: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: 8,
    marginBottom: theme.spacing.md,
  },
  debugButtonText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.md,
    fontWeight: '600' as const,
  },
  retryButton: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: 8,
    marginBottom: theme.spacing.md,
  },
  retryButtonText: {
    color: theme.colors.surface,
    fontSize: theme.fontSize.md,
    fontWeight: '600' as const,
  },
  debugError: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
    fontFamily: 'monospace',
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: '600' as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  debugText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    fontFamily: 'monospace',
  },
  fab: {
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: theme.spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  debugFab: {
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: 88, // Above the main FAB
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.warning,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  statusHeader: {
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  offlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineText: {
    fontSize: 14,
    color: theme.colors.success,
    fontWeight: '600' as const,
  },
  offlineText: {
    fontSize: 14,
    color: theme.colors.warning,
    fontWeight: '600' as const,
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  syncText: {
    fontSize: 12,
    color: theme.colors.textLight,
  },
  offlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    padding: 8,
    backgroundColor: theme.colors.warning + '10',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.warning + '30',
  },
  offlineNoticeText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.warning,
    fontWeight: '500' as const,
  },
  skipLoadingButton: {
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: theme.colors.warning,
    borderRadius: 8,
  },
  skipLoadingText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600' as const,
  },
});