import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { useProjects } from '@/hooks/project-store';
import { ProjectCard } from '@/components/ProjectCard';
import { FilterBar } from '@/components/FilterBar';
import { StatsOverview } from '@/components/StatsOverview';

export default function ProjectsScreen() {
  const router = useRouter();
  const { projects, allProjects, isLoading, error, isRecovering, clearAllData } = useProjects();
  
  // Debug logging
  console.log('🏠 ProjectsScreen render:', {
    isLoading,
    error: error ? String(error) : null,
    isRecovering,
    projectsCount: projects.length,
    allProjectsCount: allProjects.length,
    projectNames: projects.map(p => p.name)
  });

  const handleAddProject = () => {
    router.push('/add-project');
  };

  const handleRecovery = async () => {
    try {
      await clearAllData();
      // Force a page refresh by navigating to debug and back
      router.push('/debug');
    } catch (err) {
      console.error('Recovery failed:', err);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.secondary} />
        <Text style={styles.loadingText}>
          {isRecovering ? 'Recovering from data issues...' : 'Loading Homeslam...'}
        </Text>
        {isRecovering && (
          <Text style={styles.recoveryText}>
            Your data is being restored. This may take a moment.
          </Text>
        )}
      </View>
    );
  }

  if (error && !isRecovering) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>App Loading Error</Text>
        <Text style={styles.errorMessage}>
          There was an issue loading your data. The app has attempted automatic recovery.
        </Text>
        <TouchableOpacity style={styles.recoveryButton} onPress={handleRecovery}>
          <Text style={styles.recoveryButtonText}>Clear Data & Restart</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.debugButton} onPress={() => router.push('/debug')}>
          <Text style={styles.debugButtonText}>Open Debug Screen</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
        {__DEV__ && (
          <Text style={styles.debugError}>
            Error: {String(error)}
          </Text>
        )}
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
  recoveryText: {
    marginTop: 8,
    fontSize: 14,
    color: theme.colors.textLight,
    textAlign: 'center',
    paddingHorizontal: 20,
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
});