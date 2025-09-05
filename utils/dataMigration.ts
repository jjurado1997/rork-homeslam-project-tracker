import AsyncStorage from '@react-native-async-storage/async-storage';
import { trpcClient } from '@/lib/trpc';
import { Project } from '@/types/project';

const STORAGE_KEY = 'homeslam_projects';

export const migrateDataToBackend = async (): Promise<{ success: boolean; migratedCount: number; error?: string }> => {
  try {
    console.log('🔄 Starting data migration from AsyncStorage to backend...');
    
    // Get existing data from AsyncStorage
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) {
      console.log('📝 No local data found to migrate');
      return { success: true, migratedCount: 0 };
    }

    let localProjects: Project[] = [];
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        localProjects = parsed;
      }
    } catch (parseError) {
      console.error('❌ Failed to parse local data:', parseError);
      return { success: false, migratedCount: 0, error: 'Failed to parse local data' };
    }

    if (localProjects.length === 0) {
      console.log('📝 No projects found in local storage');
      return { success: true, migratedCount: 0 };
    }

    console.log(`📦 Found ${localProjects.length} projects to migrate`);

    // Check if backend already has data
    const backendProjects = await trpcClient.projects.getAll.query();
    if (backendProjects.length > 0) {
      console.log(`⚠️ Backend already has ${backendProjects.length} projects. Skipping migration to avoid duplicates.`);
      return { success: true, migratedCount: 0, error: 'Backend already has data' };
    }

    // Migrate each project to backend
    let migratedCount = 0;
    for (const project of localProjects) {
      try {
        console.log(`🚀 Migrating project: ${project.name}`);
        
        // Create the project in backend
        const createdProject = await trpcClient.projects.create.mutate({
          name: project.name,
          address: project.address || '',
          client: project.client,
          totalRevenue: project.totalRevenue,
          projectStartDate: project.projectStartDate.toISOString(),
          notes: project.notes || ''
        });

        // Migrate expenses
        for (const expense of project.expenses || []) {
          await trpcClient.expenses.create.mutate({
            projectId: createdProject.id,
            category: expense.category,
            subcategory: expense.subcategory,
            amount: expense.amount,
            description: expense.description || ''
          });
        }

        // Migrate change orders
        for (const changeOrder of project.changeOrders || []) {
          await trpcClient.changeOrders.create.mutate({
            projectId: createdProject.id,
            description: changeOrder.description,
            amount: changeOrder.amount,
            approved: changeOrder.approved
          });
        }

        // Update project completion status if needed
        if (project.isCompleted) {
          await trpcClient.projects.update.mutate({
            id: createdProject.id,
            updates: {
              isCompleted: true,
              completedAt: project.completedAt?.toISOString() || new Date().toISOString()
            }
          });
        }

        migratedCount++;
        console.log(`✅ Successfully migrated project: ${project.name}`);
      } catch (projectError) {
        console.error(`❌ Failed to migrate project ${project.name}:`, projectError);
      }
    }

    // Clear AsyncStorage after successful migration
    if (migratedCount > 0) {
      await AsyncStorage.removeItem(STORAGE_KEY);
      console.log('🧹 Cleared AsyncStorage after successful migration');
    }

    console.log(`🎉 Migration completed! Migrated ${migratedCount}/${localProjects.length} projects`);
    return { success: true, migratedCount };

  } catch (error) {
    console.error('💥 Migration failed:', error);
    return { 
      success: false, 
      migratedCount: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};