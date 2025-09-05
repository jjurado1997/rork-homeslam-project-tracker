import createContextHook from '@nkzw/create-context-hook';
import { useQueryClient } from '@tanstack/react-query';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { Project, Expense, ProjectStats, ChangeOrder } from '@/types/project';
import { trpc } from '@/lib/trpc';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';



export const [ProjectProvider, useProjects] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly'>('monthly');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [localProjects, setLocalProjects] = useState<Project[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);


  // Load local data on startup
  useEffect(() => {
    const loadLocalData = async () => {
      try {
        console.log('📱 Loading local data...');
        const stored = await AsyncStorage.getItem('homeslam_projects');
        if (stored) {
          const parsedProjects = JSON.parse(stored).map((p: any) => ({
            ...p,
            projectStartDate: new Date(p.projectStartDate),
            createdAt: new Date(p.createdAt),
            completedAt: p.completedAt ? new Date(p.completedAt) : undefined,
            expenses: p.expenses?.map((e: any) => ({
              ...e,
              date: new Date(e.date)
            })) || [],
            changeOrders: p.changeOrders?.map((co: any) => ({
              ...co,
              date: new Date(co.date)
            })) || []
          }));
          setLocalProjects(parsedProjects);
          console.log(`✅ Loaded ${parsedProjects.length} projects from local storage`);
        }
      } catch (error) {
        console.error('❌ Error loading local data:', error);
      }
    };
    loadLocalData();
  }, []);

  // Use tRPC to get projects from backend with fallback
  const projectsQuery = trpc.projects.getAll.useQuery(undefined, {
    retry: (failureCount, error) => {
      console.log(`🔄 Backend query retry attempt ${failureCount}:`, error);
      if (failureCount >= 1) {
        console.log('🔌 Backend unavailable, switching to offline mode');
        setIsOnline(false);
      }
      return failureCount < 1; // Only retry once
    },
    retryDelay: 2000,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  // Handle query success and error states
  useEffect(() => {
    if (projectsQuery.isSuccess && projectsQuery.data) {
      console.log('🌐 Backend connected successfully');
      setIsOnline(true);
      setLastSyncTime(new Date());
      // Sync backend data to local storage
      if (projectsQuery.data.length > 0) {
        AsyncStorage.setItem('homeslam_projects', JSON.stringify(projectsQuery.data))
          .then(() => console.log('💾 Synced backend data to local storage'))
          .catch((err: Error) => console.error('❌ Failed to sync to local:', err));
      }
    }
  }, [projectsQuery.isSuccess, projectsQuery.data]);

  useEffect(() => {
    if (projectsQuery.isError) {
      console.log('🔌 Backend connection failed, using offline mode:', projectsQuery.error?.message);
      setIsOnline(false);
    }
  }, [projectsQuery.isError, projectsQuery.error]);

  // Backend mutations
  const createProjectMutation = trpc.projects.create.useMutation({
    onSuccess: () => {
      console.log('✅ Project created successfully');
      queryClient.invalidateQueries({ queryKey: [['projects', 'getAll']] });
    },
    onError: (error) => {
      console.error('❌ Create project error:', error);
    }
  });

  const updateProjectMutation = trpc.projects.update.useMutation({
    onSuccess: () => {
      console.log('✅ Project updated successfully');
      queryClient.invalidateQueries({ queryKey: [['projects', 'getAll']] });
    },
    onError: (error) => {
      console.error('❌ Update project error:', error);
    }
  });

  const deleteProjectMutation = trpc.projects.delete.useMutation({
    onSuccess: () => {
      console.log('✅ Project deleted successfully');
      queryClient.invalidateQueries({ queryKey: [['projects', 'getAll']] });
    },
    onError: (error) => {
      console.error('❌ Delete project error:', error);
    }
  });

  const createExpenseMutation = trpc.expenses.create.useMutation({
    onSuccess: () => {
      console.log('✅ Expense created successfully');
      queryClient.invalidateQueries({ queryKey: [['projects', 'getAll']] });
    },
    onError: (error) => {
      console.error('❌ Create expense error:', error);
    }
  });

  const updateExpenseMutation = trpc.expenses.update.useMutation({
    onSuccess: () => {
      console.log('✅ Expense updated successfully');
      queryClient.invalidateQueries({ queryKey: [['projects', 'getAll']] });
    },
    onError: (error) => {
      console.error('❌ Update expense error:', error);
    }
  });

  const deleteExpenseMutation = trpc.expenses.delete.useMutation({
    onSuccess: () => {
      console.log('✅ Expense deleted successfully');
      queryClient.invalidateQueries({ queryKey: [['projects', 'getAll']] });
    },
    onError: (error) => {
      console.error('❌ Delete expense error:', error);
    }
  });

  const createChangeOrderMutation = trpc.changeOrders.create.useMutation({
    onSuccess: () => {
      console.log('✅ Change order created successfully');
      queryClient.invalidateQueries({ queryKey: [['projects', 'getAll']] });
    },
    onError: (error) => {
      console.error('❌ Create change order error:', error);
    }
  });

  const updateChangeOrderMutation = trpc.changeOrders.update.useMutation({
    onSuccess: () => {
      console.log('✅ Change order updated successfully');
      queryClient.invalidateQueries({ queryKey: [['projects', 'getAll']] });
    },
    onError: (error) => {
      console.error('❌ Update change order error:', error);
    }
  });

  const deleteChangeOrderMutation = trpc.changeOrders.delete.useMutation({
    onSuccess: () => {
      console.log('✅ Change order deleted successfully');
      queryClient.invalidateQueries({ queryKey: [['projects', 'getAll']] });
    },
    onError: (error) => {
      console.error('❌ Delete change order error:', error);
    }
  });

  // Use backend data if available, otherwise use local data
  const projects = useMemo(() => {
    if (isOnline && projectsQuery.data) {
      return projectsQuery.data;
    }
    return localProjects;
  }, [isOnline, projectsQuery.data, localProjects]);

  // Save to local storage helper
  const saveToLocal = useCallback(async (updatedProjects: Project[]) => {
    try {
      await AsyncStorage.setItem('homeslam_projects', JSON.stringify(updatedProjects));
      setLocalProjects(updatedProjects);
      console.log('💾 Saved to local storage');
    } catch (error) {
      console.error('❌ Failed to save to local storage:', error);
    }
  }, []);

  // Hybrid functions that work online and offline
  const addProject = useCallback((project: Omit<Project, 'id' | 'createdAt' | 'expenses' | 'isCompleted' | 'changeOrders'>) => {
    const newProject: Project = {
      ...project,
      id: Date.now().toString(),
      createdAt: new Date(),
      expenses: [],
      changeOrders: [],
      isCompleted: false
    };

    if (isOnline) {
      console.log('🌐 Adding project to backend:', project.name);
      createProjectMutation.mutate({
        name: project.name,
        address: project.address || '',
        client: project.client,
        totalRevenue: project.totalRevenue,
        projectStartDate: project.projectStartDate.toISOString(),
        notes: project.notes || ''
      });
    } else {
      console.log('📱 Adding project locally (offline):', project.name);
      const updatedProjects = [...projects, newProject];
      saveToLocal(updatedProjects);
    }
  }, [isOnline, createProjectMutation, projects, saveToLocal]);

  const updateProject = useCallback((projectId: string, updates: Partial<Project>) => {
    if (isOnline) {
      console.log('🌐 Updating project in backend:', projectId);
      const backendUpdates: any = { ...updates };
      if (updates.projectStartDate) {
        backendUpdates.projectStartDate = updates.projectStartDate.toISOString();
      }
      if (updates.completedAt) {
        backendUpdates.completedAt = updates.completedAt.toISOString();
      }
      updateProjectMutation.mutate({ id: projectId, updates: backendUpdates });
    } else {
      console.log('📱 Updating project locally (offline):', projectId);
      const updatedProjects = projects.map(p => 
        p.id === projectId ? { ...p, ...updates } : p
      );
      saveToLocal(updatedProjects);
    }
  }, [isOnline, updateProjectMutation, projects, saveToLocal]);

  const deleteProject = useCallback((projectId: string) => {
    if (isOnline) {
      console.log('🌐 Deleting project from backend:', projectId);
      deleteProjectMutation.mutate({ id: projectId });
    } else {
      console.log('📱 Deleting project locally (offline):', projectId);
      const updatedProjects = projects.filter(p => p.id !== projectId);
      saveToLocal(updatedProjects);
    }
  }, [isOnline, deleteProjectMutation, projects, saveToLocal]);

  const addExpense = useCallback((projectId: string, expense: Omit<Expense, 'id' | 'date'>) => {
    const newExpense: Expense = {
      ...expense,
      id: Date.now().toString(),
      date: new Date()
    };

    if (isOnline) {
      console.log('🌐 Adding expense to backend:', expense.description);
      createExpenseMutation.mutate({
        projectId,
        category: expense.category,
        subcategory: expense.subcategory,
        amount: expense.amount,
        description: expense.description || ''
      });
    } else {
      console.log('📱 Adding expense locally (offline):', expense.description);
      const updatedProjects = projects.map(p => 
        p.id === projectId 
          ? { ...p, expenses: [...p.expenses, newExpense] }
          : p
      );
      saveToLocal(updatedProjects);
    }
  }, [isOnline, createExpenseMutation, projects, saveToLocal]);

  const updateExpense = useCallback((projectId: string, expenseId: string, updates: Partial<Omit<Expense, 'id' | 'date'>>) => {
    if (isOnline) {
      console.log('🌐 Updating expense in backend:', expenseId);
      updateExpenseMutation.mutate({ projectId, expenseId, updates });
    } else {
      console.log('📱 Updating expense locally (offline):', expenseId);
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
      saveToLocal(updatedProjects);
    }
  }, [isOnline, updateExpenseMutation, projects, saveToLocal]);

  const deleteExpense = useCallback((projectId: string, expenseId: string) => {
    if (isOnline) {
      console.log('🌐 Deleting expense from backend:', expenseId);
      deleteExpenseMutation.mutate({ projectId, expenseId });
    } else {
      console.log('📱 Deleting expense locally (offline):', expenseId);
      const updatedProjects = projects.map(p => 
        p.id === projectId 
          ? { ...p, expenses: p.expenses.filter(e => e.id !== expenseId) }
          : p
      );
      saveToLocal(updatedProjects);
    }
  }, [isOnline, deleteExpenseMutation, projects, saveToLocal]);

  const completeProject = useCallback((projectId: string) => {
    const completedAt = new Date();
    if (isOnline) {
      console.log('🌐 Completing project in backend:', projectId);
      updateProjectMutation.mutate({ 
        id: projectId, 
        updates: { 
          isCompleted: true, 
          completedAt: completedAt.toISOString() 
        } 
      });
    } else {
      console.log('📱 Completing project locally (offline):', projectId);
      const updatedProjects = projects.map(p => 
        p.id === projectId 
          ? { ...p, isCompleted: true, completedAt }
          : p
      );
      saveToLocal(updatedProjects);
    }
  }, [isOnline, updateProjectMutation, projects, saveToLocal]);

  const reopenProject = useCallback((projectId: string) => {
    if (isOnline) {
      console.log('🌐 Reopening project in backend:', projectId);
      updateProjectMutation.mutate({ 
        id: projectId, 
        updates: { 
          isCompleted: false, 
          completedAt: null 
        } 
      });
    } else {
      console.log('📱 Reopening project locally (offline):', projectId);
      const updatedProjects = projects.map(p => 
        p.id === projectId 
          ? { ...p, isCompleted: false, completedAt: undefined }
          : p
      );
      saveToLocal(updatedProjects);
    }
  }, [isOnline, updateProjectMutation, projects, saveToLocal]);

  const addChangeOrder = useCallback((projectId: string, changeOrder: Omit<ChangeOrder, 'id' | 'date'>) => {
    const newChangeOrder: ChangeOrder = {
      ...changeOrder,
      id: Date.now().toString(),
      date: new Date()
    };

    if (isOnline) {
      console.log('🌐 Adding change order to backend:', changeOrder.description);
      createChangeOrderMutation.mutate({
        projectId,
        description: changeOrder.description,
        amount: changeOrder.amount,
        approved: changeOrder.approved
      });
    } else {
      console.log('📱 Adding change order locally (offline):', changeOrder.description);
      const updatedProjects = projects.map(p => 
        p.id === projectId 
          ? { ...p, changeOrders: [...(p.changeOrders || []), newChangeOrder] }
          : p
      );
      saveToLocal(updatedProjects);
    }
  }, [isOnline, createChangeOrderMutation, projects, saveToLocal]);

  const updateChangeOrder = useCallback((projectId: string, changeOrderId: string, updates: Partial<Omit<ChangeOrder, 'id' | 'date'>>) => {
    if (isOnline) {
      console.log('🌐 Updating change order in backend:', changeOrderId);
      updateChangeOrderMutation.mutate({ projectId, changeOrderId, updates });
    } else {
      console.log('📱 Updating change order locally (offline):', changeOrderId);
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
      saveToLocal(updatedProjects);
    }
  }, [isOnline, updateChangeOrderMutation, projects, saveToLocal]);

  const deleteChangeOrder = useCallback((projectId: string, changeOrderId: string) => {
    if (isOnline) {
      console.log('🌐 Deleting change order from backend:', changeOrderId);
      deleteChangeOrderMutation.mutate({ projectId, changeOrderId });
    } else {
      console.log('📱 Deleting change order locally (offline):', changeOrderId);
      const updatedProjects = projects.map(p => 
        p.id === projectId 
          ? { ...p, changeOrders: (p.changeOrders || []).filter(co => co.id !== changeOrderId) }
          : p
      );
      saveToLocal(updatedProjects);
    }
  }, [isOnline, deleteChangeOrderMutation, projects, saveToLocal]);

  const calculateStats = useCallback((project: Project): ProjectStats => {
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
  }, []);

  const filteredProjects = useMemo(() => {
    let filtered = projects;
    
    if (selectedFilter === 'active') {
      filtered = filtered.filter(p => !p.isCompleted || p.isCompleted === undefined);
    } else if (selectedFilter === 'completed') {
      filtered = filtered.filter(p => p.isCompleted === true);
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

  // Force sync function to manually sync local data to backend
  const syncToBackend = useCallback(async () => {
    if (!isOnline || localProjects.length === 0) {
      return { success: false, message: 'No connection or no local data to sync' };
    }

    try {
      console.log('🔄 Syncing local data to backend...');
      // This would need to be implemented based on your backend API
      // For now, just refresh the query to get latest backend data
      await queryClient.invalidateQueries({ queryKey: [['projects', 'getAll']] });
      return { success: true, message: 'Sync completed' };
    } catch (error) {
      console.error('❌ Sync failed:', error);
      return { success: false, message: `Sync failed: ${error}` };
    }
  }, [isOnline, localProjects, queryClient]);

  // Clear all data function
  const clearAllData = useCallback(async () => {
    await AsyncStorage.removeItem('homeslam_projects');
    setLocalProjects([]);
    console.log('🧹 Local data cleared');
  }, []);

  return useMemo(() => ({
    projects: filteredProjects,
    allProjects: projects,
    isLoading: projectsQuery.isLoading && isOnline,
    error: isOnline ? projectsQuery.error : null,
    isOnline,
    lastSyncTime,
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
    syncToBackend,
    clearAllData,
  }), [
    filteredProjects,
    projects,
    projectsQuery.isLoading,
    projectsQuery.error,
    isOnline,
    lastSyncTime,
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
    syncToBackend,
    clearAllData
  ]);
});