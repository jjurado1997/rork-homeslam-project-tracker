import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { Project, Expense, ProjectStats, ChangeOrder } from '@/types/project';

const STORAGE_KEY = 'homeslam_projects';

// Recovery function to clear corrupted data
const clearStorageIfCorrupted = async () => {
  try {
    console.log('🩹 Attempting to clear potentially corrupted storage...');
    await AsyncStorage.removeItem(STORAGE_KEY);
    console.log('✅ Storage cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing storage:', error);
  }
};



export const [ProjectProvider, useProjects] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly'>('monthly');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [initError, setInitError] = useState<string | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);

  const projectsQuery = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      try {
        console.log('🔄 Loading projects from AsyncStorage...');
        setInitError(null);
        setIsRecovering(false);
        
        // Add timeout to prevent hanging on mobile
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('AsyncStorage timeout')), 10000);
        });
        
        const storagePromise = AsyncStorage.getItem(STORAGE_KEY);
        const stored = await Promise.race([storagePromise, timeoutPromise]) as string | null;
        
        console.log('📦 Raw stored data:', stored ? 'Found data' : 'No data found');
        
        let projects: Project[] = [];
        
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              projects = parsed;
              console.log('✅ Successfully parsed projects:', projects.length);
              console.log('📋 Project names:', projects.map(p => p?.name || 'Unknown'));
            } else {
              console.warn('⚠️ Stored data is not an array, clearing...');
              await AsyncStorage.removeItem(STORAGE_KEY);
              return [];
            }
          } catch (parseError) {
            console.error('❌ Error parsing stored projects:', parseError);
            await AsyncStorage.removeItem(STORAGE_KEY);
            return [];
          }
        } else {
          console.log('📝 No projects found in storage, starting fresh');
        }
        
        // Normalize dates with better error handling
        const normalizedProjects = projects.map((p, index) => {
          try {
            // Validate project has minimum required properties
            if (!p || typeof p !== 'object') {
              console.warn(`⚠️ Invalid project object at index ${index}:`, p);
              return null;
            }
            
            // Safe date parsing function
            const safeParseDate = (dateValue: any, fallback: Date = new Date()): Date => {
              if (!dateValue) return fallback;
              
              try {
                const parsed = new Date(dateValue);
                if (isNaN(parsed.getTime())) {
                  console.warn('Invalid date value:', dateValue);
                  return fallback;
                }
                return parsed;
              } catch (error) {
                console.warn('Error parsing date:', dateValue, error);
                return fallback;
              }
            };
            
            // Ensure all required properties exist with safe defaults
            const createdAt = safeParseDate(p.createdAt);
            const projectStartDate = safeParseDate(
              p.projectStartDate || (p as any).startDate,
              createdAt
            );
            const completedAt = p.completedAt ? safeParseDate(p.completedAt) : undefined;
            
            return {
              id: p.id || `project_${Date.now()}_${index}`,
              name: p.name || `Unnamed Project ${index + 1}`,
              address: p.address || '',
              client: p.client || 'Bottomline',
              totalRevenue: typeof p.totalRevenue === 'number' && !isNaN(p.totalRevenue) ? p.totalRevenue : 0,
              createdAt,
              projectStartDate,
              completedAt,
              isCompleted: Boolean(p.isCompleted),
              notes: p.notes || '',
              changeOrders: Array.isArray(p.changeOrders) ? p.changeOrders.map((co, coIndex) => {
                try {
                  return {
                    id: co?.id || `co_${Date.now()}_${coIndex}`,
                    description: co?.description || '',
                    amount: typeof co?.amount === 'number' && !isNaN(co.amount) ? co.amount : 0,
                    date: safeParseDate(co?.date),
                    approved: Boolean(co?.approved)
                  };
                } catch (coError) {
                  console.warn(`⚠️ Invalid change order at index ${coIndex}:`, co);
                  return {
                    id: `co_${Date.now()}_${coIndex}`,
                    description: 'Invalid Change Order',
                    amount: 0,
                    date: new Date(),
                    approved: false
                  };
                }
              }) : [],
              expenses: Array.isArray(p.expenses) ? p.expenses.map((e, eIndex) => {
                try {
                  return {
                    id: e?.id || `expense_${Date.now()}_${eIndex}`,
                    category: (e?.category as any) || 'other',
                    subcategory: e?.subcategory || 'Miscellaneous',
                    amount: typeof e?.amount === 'number' && !isNaN(e.amount) ? e.amount : 0,
                    description: e?.description || '',
                    date: safeParseDate(e?.date)
                  };
                } catch (eError) {
                  console.warn(`⚠️ Invalid expense at index ${eIndex}:`, e);
                  return {
                    id: `expense_${Date.now()}_${eIndex}`,
                    category: 'other' as const,
                    subcategory: 'Miscellaneous',
                    amount: 0,
                    description: 'Invalid Expense',
                    date: new Date()
                  };
                }
              }) : []
            };
          } catch (normalizationError) {
            console.error(`❌ Error normalizing project at index ${index}:`, p?.name || 'Unknown', normalizationError);
            return null;
          }
        }).filter(Boolean) as Project[];
        
        console.log('🎯 Final normalized projects:', normalizedProjects.length);
        return normalizedProjects;
      } catch (error) {
        console.error('💥 Critical error loading projects:', error);
        // Try to clear corrupted data automatically
        try {
          await AsyncStorage.removeItem(STORAGE_KEY);
          console.log('🧹 Cleared corrupted storage automatically');
        } catch (clearError) {
          console.error('❌ Failed to clear corrupted storage:', clearError);
        }
        return [];
      }
    },
    retry: (failureCount, error) => {
      console.log(`🔄 Query retry attempt ${failureCount}:`, error);
      return failureCount < 2; // Allow 2 retries max
    },
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    networkMode: 'always' // Always run query even if offline
  });

  const saveMutation = useMutation({
    mutationFn: async (projects: Project[]) => {
      try {
        console.log('💾 Saving projects to AsyncStorage:', projects.length);
        console.log('📋 Project names being saved:', projects.map(p => p.name));
        
        const dataToSave = JSON.stringify(projects);
        console.log('📦 Data size:', Math.round(dataToSave.length / 1024), 'KB');
        
        await AsyncStorage.setItem(STORAGE_KEY, dataToSave);
        
        // Verify the save worked
        const verification = await AsyncStorage.getItem(STORAGE_KEY);
        if (verification) {
          const parsed = JSON.parse(verification);
          console.log('✅ Save verification successful:', parsed.length, 'projects');
        } else {
          throw new Error('Save verification failed - no data found after save');
        }
        
        console.log('🎉 Projects saved successfully');
        return projects;
      } catch (error) {
        console.error('💥 Critical error saving projects:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('🔄 Invalidating queries after successful save');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error) => {
      console.error('❌ Save mutation error:', error);
    }
  });

  const projects = projectsQuery.data || [];

  const addProject = (project: Omit<Project, 'id' | 'createdAt' | 'expenses' | 'isCompleted' | 'changeOrders'>) => {
    const newProject: Project = {
      ...project,
      id: Date.now().toString(),
      createdAt: new Date(),
      expenses: [],
      changeOrders: [],
      isCompleted: false,
    };
    saveMutation.mutate([...projects, newProject]);
  };

  const updateProject = (projectId: string, updates: Partial<Project>) => {
    const updatedProjects = projects.map(p =>
      p.id === projectId ? { ...p, ...updates } : p
    );
    saveMutation.mutate(updatedProjects);
  };

  const deleteProject = (projectId: string) => {
    const updatedProjects = projects.filter(p => p.id !== projectId);
    saveMutation.mutate(updatedProjects);
  };

  const addExpense = (projectId: string, expense: Omit<Expense, 'id' | 'date'>) => {
    const newExpense: Expense = {
      ...expense,
      id: Date.now().toString(),
      date: new Date(),
    };
    const updatedProjects = projects.map(p =>
      p.id === projectId
        ? { ...p, expenses: [...p.expenses, newExpense] }
        : p
    );
    saveMutation.mutate(updatedProjects);
  };

  const updateExpense = (projectId: string, expenseId: string, updates: Partial<Omit<Expense, 'id' | 'date'>>) => {
    const updatedProjects = projects.map(p =>
      p.id === projectId
        ? {
            ...p,
            expenses: p.expenses.map(e =>
              e.id === expenseId ? { ...e, ...updates } : e
            )
          }
        : p
    );
    saveMutation.mutate(updatedProjects);
  };

  const deleteExpense = (projectId: string, expenseId: string) => {
    const updatedProjects = projects.map(p =>
      p.id === projectId
        ? { ...p, expenses: p.expenses.filter(e => e.id !== expenseId) }
        : p
    );
    saveMutation.mutate(updatedProjects);
  };

  const completeProject = (projectId: string) => {
    const updatedProjects = projects.map(p =>
      p.id === projectId
        ? { ...p, isCompleted: true, completedAt: new Date() }
        : p
    );
    saveMutation.mutate(updatedProjects);
  };

  const reopenProject = (projectId: string) => {
    const updatedProjects = projects.map(p =>
      p.id === projectId
        ? { ...p, isCompleted: false, completedAt: undefined }
        : p
    );
    saveMutation.mutate(updatedProjects);
  };

  const addChangeOrder = (projectId: string, changeOrder: Omit<ChangeOrder, 'id' | 'date'>) => {
    const newChangeOrder: ChangeOrder = {
      ...changeOrder,
      id: Date.now().toString(),
      date: new Date(),
    };
    const updatedProjects = projects.map(p =>
      p.id === projectId
        ? { ...p, changeOrders: [...(p.changeOrders || []), newChangeOrder] }
        : p
    );
    saveMutation.mutate(updatedProjects);
  };

  const updateChangeOrder = (projectId: string, changeOrderId: string, updates: Partial<Omit<ChangeOrder, 'id' | 'date'>>) => {
    const updatedProjects = projects.map(p =>
      p.id === projectId
        ? {
            ...p,
            changeOrders: (p.changeOrders || []).map(co =>
              co.id === changeOrderId ? { ...co, ...updates } : co
            )
          }
        : p
    );
    saveMutation.mutate(updatedProjects);
  };

  const deleteChangeOrder = (projectId: string, changeOrderId: string) => {
    const updatedProjects = projects.map(p =>
      p.id === projectId
        ? { ...p, changeOrders: (p.changeOrders || []).filter(co => co.id !== changeOrderId) }
        : p
    );
    saveMutation.mutate(updatedProjects);
  };

  const calculateStats = (project: Project): ProjectStats => {
    const totalExpenses = project.expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalChangeOrders = (project.changeOrders || [])
      .filter(co => co.approved)
      .reduce((sum, co) => sum + co.amount, 0);
    const laborExpenses = project.expenses
      .filter(e => e.category === 'labor')
      .reduce((sum, e) => sum + e.amount, 0);
    
    const totalRevenue = project.totalRevenue + totalChangeOrders;
    const profit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
    const laborPercentage = totalRevenue > 0 ? (laborExpenses / totalRevenue) * 100 : 0;

    return {
      totalRevenue: project.totalRevenue,
      totalChangeOrders,
      totalExpenses,
      profit,
      profitMargin,
      laborPercentage,
    };
  };

  const filteredProjects = useMemo(() => {
    let filtered = projects;
    
    if (selectedFilter === 'active') {
      filtered = filtered.filter(p => !p.isCompleted);
    } else if (selectedFilter === 'completed') {
      filtered = filtered.filter(p => p.isCompleted);
    }

    if (selectedClient !== 'all') {
      filtered = filtered.filter(p => p.client === selectedClient);
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Calculate quarter start: Q1=Jan(0-2), Q2=Apr(3-5), Q3=Jul(6-8), Q4=Oct(9-11)
    // JavaScript months are 0-based: Jan=0, Feb=1, ..., Jul=6, Aug=7, Sep=8, ..., Dec=11
    const currentMonth = now.getMonth(); // 0-based: Jan=0, Feb=1, ..., Dec=11
    const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
    const startOfQuarter = new Date(now.getFullYear(), quarterStartMonth, 1);
    startOfQuarter.setHours(0, 0, 0, 0); // Ensure we start at beginning of day

    switch (selectedPeriod) {
      case 'daily':
        // Show projects that start TODAY only (not future dates)
        filtered = filtered.filter(p => {
          const projectDate = new Date(p.projectStartDate);
          projectDate.setHours(0, 0, 0, 0);
          const todayStart = new Date(startOfDay);
          todayStart.setHours(0, 0, 0, 0);
          return projectDate.getTime() === todayStart.getTime();
        });
        break;
      case 'weekly':
        filtered = filtered.filter(p => p.projectStartDate >= startOfWeek);
        break;
      case 'monthly':
        filtered = filtered.filter(p => p.projectStartDate >= startOfMonth);
        break;
      case 'quarterly':
        filtered = filtered.filter(p => {
          // Normalize project date to start of day for comparison
          const projectDate = new Date(p.projectStartDate);
          projectDate.setHours(0, 0, 0, 0);
          console.log('Quarterly filter debug:', {
            projectName: p.name,
            projectStartDate: p.projectStartDate.toISOString(),
            normalizedProjectDate: projectDate.toISOString(),
            startOfQuarter: startOfQuarter.toISOString(),
            isInQuarter: projectDate >= startOfQuarter,
            currentMonth: now.getMonth(),
            quarterStartMonth
          });
          return projectDate >= startOfQuarter;
        });
        break;
    }
    


    return filtered.sort((a, b) => b.projectStartDate.getTime() - a.projectStartDate.getTime());
  }, [projects, selectedFilter, selectedPeriod, selectedClient]);

  return {
    projects: filteredProjects,
    allProjects: projects,
    isLoading: projectsQuery.isLoading,
    error: projectsQuery.error || initError,
    isRecovering,
    selectedFilter,
    setSelectedFilter,
    selectedPeriod,
    setSelectedPeriod,
    selectedClient,
    setSelectedClient,
    addProject,
    updateProject,
    deleteProject,
    addExpense,
    updateExpense,
    deleteExpense,
    addChangeOrder,
    updateChangeOrder,
    deleteChangeOrder,
    completeProject,
    reopenProject,
    calculateStats,
    clearAllData: clearStorageIfCorrupted,
  };
});