import createContextHook from '@nkzw/create-context-hook';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { Project, Expense, ProjectStats, ChangeOrder } from '@/types/project';
import AsyncStorage from '@react-native-async-storage/async-storage';




export const [ProjectProvider, useProjects] = createContextHook(() => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly'>('monthly');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [localProjects, setLocalProjects] = useState<Project[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSyncTime] = useState<Date | null>(null);


  // Load local data on startup with robust error handling
  useEffect(() => {
    const loadLocalData = async () => {
      try {
        console.log('📱 Loading local data...');
        const stored = await AsyncStorage.getItem('homeslam_projects');
        if (stored && stored.trim()) {
          try {
            // Validate JSON before parsing
            const parsed = JSON.parse(stored);
            if (!Array.isArray(parsed)) {
              throw new Error('Invalid data format: not an array');
            }
            
            const parsedProjects = parsed.map((p: any, index: number) => {
              try {
                // Validate required fields
                if (!p.id || !p.name) {
                  console.warn(`⚠️ Skipping invalid project at index ${index}:`, p);
                  return null;
                }
                
                return {
                  ...p,
                  projectStartDate: p.projectStartDate ? new Date(p.projectStartDate) : new Date(),
                  createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
                  completedAt: p.completedAt ? new Date(p.completedAt) : undefined,
                  expenses: Array.isArray(p.expenses) ? p.expenses.map((e: any) => ({
                    ...e,
                    date: e.date ? new Date(e.date) : new Date(),
                    amount: typeof e.amount === 'number' ? e.amount : 0
                  })) : [],
                  changeOrders: Array.isArray(p.changeOrders) ? p.changeOrders.map((co: any) => ({
                    ...co,
                    date: co.date ? new Date(co.date) : new Date(),
                    amount: typeof co.amount === 'number' ? co.amount : 0
                  })) : [],
                  totalRevenue: typeof p.totalRevenue === 'number' ? p.totalRevenue : 0,
                  isCompleted: Boolean(p.isCompleted)
                };
              } catch (projectError) {
                console.warn(`⚠️ Error parsing project at index ${index}:`, projectError);
                return null;
              }
            }).filter(Boolean); // Remove null entries
            
            setLocalProjects(parsedProjects);
            console.log(`✅ Loaded ${parsedProjects.length} valid projects from local storage`);
          } catch (parseError) {
            console.error('❌ JSON parse error, clearing corrupted data:', parseError);
            await AsyncStorage.removeItem('homeslam_projects');
            setLocalProjects([]);
          }
        } else {
          console.log('📱 No local data found, starting fresh');
          setLocalProjects([]);
        }
      } catch (error) {
        console.error('❌ Critical error loading local data:', error);
        // Clear potentially corrupted data and start fresh
        try {
          await AsyncStorage.removeItem('homeslam_projects');
          setLocalProjects([]);
          console.log('🧹 Cleared corrupted data, starting fresh');
        } catch (clearError) {
          console.error('❌ Failed to clear corrupted data:', clearError);
          setLocalProjects([]);
        }
      }
    };
    loadLocalData();
  }, []);

  // BACKEND DISABLED - Using offline-only mode
  const projectsQuery = {
    data: null,
    isLoading: false,
    isSuccess: false,
    isError: false,
    error: null,
    refetch: async () => ({ data: null })
  };

  // BACKEND DISABLED - Force offline mode
  useEffect(() => {
    console.log('📱 Backend disabled - running in offline-only mode');
    setIsOnline(false);
  }, []);

  // BACKEND DISABLED - No mutations needed in offline-only mode

  // Save to local storage helper with validation and backup
  const saveToLocal = useCallback(async (updatedProjects: Project[]) => {
    try {
      // Validate data before saving
      if (!Array.isArray(updatedProjects)) {
        throw new Error('Invalid data: not an array');
      }
      
      // Create a backup of current data first
      const currentData = await AsyncStorage.getItem('homeslam_projects');
      if (currentData) {
        await AsyncStorage.setItem('homeslam_projects_backup', currentData);
      }
      
      // Serialize and validate JSON
      const serialized = JSON.stringify(updatedProjects);
      if (serialized.length > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('Data too large to store');
      }
      
      // Test parse to ensure data integrity
      JSON.parse(serialized);
      
      await AsyncStorage.setItem('homeslam_projects', serialized);
      setLocalProjects(updatedProjects);
      console.log(`💾 Saved ${updatedProjects.length} projects to local storage`);
    } catch (error) {
      console.error('❌ Failed to save to local storage:', error);
      
      // Try to restore from backup if save failed
      try {
        const backup = await AsyncStorage.getItem('homeslam_projects_backup');
        if (backup) {
          const backupData = JSON.parse(backup);
          setLocalProjects(backupData);
          console.log('🔄 Restored from backup after save failure');
        }
      } catch (restoreError) {
        console.error('❌ Failed to restore from backup:', restoreError);
      }
    }
  }, []);

  // BACKEND DISABLED - Always use local data
  const projects = useMemo(() => {
    console.log('📱 Using local data (offline-only mode):', localProjects.length, 'projects');
    return localProjects;
  }, [localProjects]);

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

    console.log('📱 Adding project locally (offline-only mode):', project.name);
    const updatedProjects = [...projects, newProject];
    saveToLocal(updatedProjects);
  }, [projects, saveToLocal]);

  const updateProject = useCallback((projectId: string, updates: Partial<Project>) => {
    console.log('📱 Updating project locally (offline-only mode):', projectId);
    const updatedProjects = projects.map(p => 
      p.id === projectId ? { ...p, ...updates } : p
    );
    saveToLocal(updatedProjects);
  }, [projects, saveToLocal]);

  const deleteProject = useCallback((projectId: string) => {
    console.log('📱 Deleting project locally (offline-only mode):', projectId);
    const updatedProjects = projects.filter(p => p.id !== projectId);
    saveToLocal(updatedProjects);
  }, [projects, saveToLocal]);

  const addExpense = useCallback((projectId: string, expense: Omit<Expense, 'id' | 'date'>) => {
    const newExpense: Expense = {
      ...expense,
      id: Date.now().toString(),
      date: new Date()
    };

    console.log('📱 Adding expense locally (offline-only mode):', expense.description);
    const updatedProjects = projects.map(p => 
      p.id === projectId 
        ? { ...p, expenses: [...p.expenses, newExpense] }
        : p
    );
    saveToLocal(updatedProjects);
  }, [projects, saveToLocal]);

  const updateExpense = useCallback((projectId: string, expenseId: string, updates: Partial<Omit<Expense, 'id' | 'date'>>) => {
    console.log('📱 Updating expense locally (offline-only mode):', expenseId);
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
  }, [projects, saveToLocal]);

  const deleteExpense = useCallback((projectId: string, expenseId: string) => {
    console.log('📱 Deleting expense locally (offline-only mode):', expenseId);
    const updatedProjects = projects.map(p => 
      p.id === projectId 
        ? { ...p, expenses: p.expenses.filter(e => e.id !== expenseId) }
        : p
    );
    saveToLocal(updatedProjects);
  }, [projects, saveToLocal]);

  const completeProject = useCallback((projectId: string) => {
    const completedAt = new Date();
    console.log('📱 Completing project locally (offline-only mode):', projectId);
    const updatedProjects = projects.map(p => 
      p.id === projectId 
        ? { ...p, isCompleted: true, completedAt }
        : p
    );
    saveToLocal(updatedProjects);
  }, [projects, saveToLocal]);

  const reopenProject = useCallback((projectId: string) => {
    console.log('📱 Reopening project locally (offline-only mode):', projectId);
    const updatedProjects = projects.map(p => 
      p.id === projectId 
        ? { ...p, isCompleted: false, completedAt: undefined }
        : p
    );
    saveToLocal(updatedProjects);
  }, [projects, saveToLocal]);

  const addChangeOrder = useCallback((projectId: string, changeOrder: Omit<ChangeOrder, 'id' | 'date'>) => {
    const newChangeOrder: ChangeOrder = {
      ...changeOrder,
      id: Date.now().toString(),
      date: new Date()
    };

    console.log('📱 Adding change order locally (offline-only mode):', changeOrder.description);
    const updatedProjects = projects.map(p => 
      p.id === projectId 
        ? { ...p, changeOrders: [...(p.changeOrders || []), newChangeOrder] }
        : p
    );
    saveToLocal(updatedProjects);
  }, [projects, saveToLocal]);

  const updateChangeOrder = useCallback((projectId: string, changeOrderId: string, updates: Partial<Omit<ChangeOrder, 'id' | 'date'>>) => {
    console.log('📱 Updating change order locally (offline-only mode):', changeOrderId);
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
  }, [projects, saveToLocal]);

  const deleteChangeOrder = useCallback((projectId: string, changeOrderId: string) => {
    console.log('📱 Deleting change order locally (offline-only mode):', changeOrderId);
    const updatedProjects = projects.map(p => 
      p.id === projectId 
        ? { ...p, changeOrders: (p.changeOrders || []).filter(co => co.id !== changeOrderId) }
        : p
    );
    saveToLocal(updatedProjects);
  }, [projects, saveToLocal]);

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
    
    console.log('🔍 Filtering projects:', {
      totalProjects: projects.length,
      selectedFilter,
      selectedPeriod,
      selectedClient,
      projectNames: projects.map(p => ({ name: p.name, isCompleted: p.isCompleted, startDate: p.projectStartDate }))
    });
    
    // Apply status filter
    if (selectedFilter === 'active') {
      filtered = filtered.filter(p => !p.isCompleted || p.isCompleted === undefined);
      console.log('🔍 After active filter:', filtered.length, 'projects');
    } else if (selectedFilter === 'completed') {
      filtered = filtered.filter(p => p.isCompleted === true);
      console.log('🔍 After completed filter:', filtered.length, 'projects');
    }

    // Apply client filter
    if (selectedClient !== 'all') {
      filtered = filtered.filter(p => p.client === selectedClient);
      console.log('🔍 After client filter:', filtered.length, 'projects');
    }

    // Apply period filter - but make it more lenient for existing projects
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Calculate quarter start: Q1=Jan(0-2), Q2=Apr(3-5), Q3=Jul(6-8), Q4=Oct(9-11)
    const currentMonth = now.getMonth();
    const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
    const startOfQuarter = new Date(now.getFullYear(), quarterStartMonth, 1);
    startOfQuarter.setHours(0, 0, 0, 0);

    // For period filtering, be more inclusive - show projects that are still relevant
    switch (selectedPeriod) {
      case 'daily':
        // Show ONLY projects that start TODAY
        filtered = filtered.filter(p => {
          const projectDate = new Date(p.projectStartDate);
          projectDate.setHours(0, 0, 0, 0);
          const todayStart = new Date(startOfDay);
          todayStart.setHours(0, 0, 0, 0);
          const isToday = projectDate.getTime() === todayStart.getTime();
          return isToday;
        });
        break;
      case 'weekly':
        // Show projects from this week OR active projects
        filtered = filtered.filter(p => {
          const isThisWeek = p.projectStartDate >= startOfWeek;
          const isActiveProject = !p.isCompleted;
          return isThisWeek || isActiveProject;
        });
        break;
      case 'monthly':
        // Show projects from this month OR active projects
        filtered = filtered.filter(p => {
          const isThisMonth = p.projectStartDate >= startOfMonth;
          const isActiveProject = !p.isCompleted;
          return isThisMonth || isActiveProject;
        });
        break;
      case 'quarterly':
        // Show projects from this quarter OR active projects
        filtered = filtered.filter(p => {
          const projectDate = new Date(p.projectStartDate);
          projectDate.setHours(0, 0, 0, 0);
          const isThisQuarter = projectDate >= startOfQuarter;
          const isActiveProject = !p.isCompleted;
          console.log('Quarterly filter debug:', {
            projectName: p.name,
            projectStartDate: p.projectStartDate.toISOString(),
            normalizedProjectDate: projectDate.toISOString(),
            startOfQuarter: startOfQuarter.toISOString(),
            isThisQuarter,
            isActiveProject,
            willShow: isThisQuarter || isActiveProject
          });
          return isThisQuarter || isActiveProject;
        });
        break;
    }
    
    console.log('🔍 Final filtered projects:', {
      count: filtered.length,
      names: filtered.map(p => p.name)
    });

    return filtered.sort((a, b) => b.projectStartDate.getTime() - a.projectStartDate.getTime());
  }, [projects, selectedFilter, selectedPeriod, selectedClient]);

  // BACKEND DISABLED - Mock sync function
  const syncToBackend = useCallback(async () => {
    console.log('📱 Backend disabled - sync not available');
    return { success: false, message: 'Backend disabled - running in offline-only mode' };
  }, []);

  // Clear all data function
  const clearAllData = useCallback(async () => {
    await AsyncStorage.removeItem('homeslam_projects');
    setLocalProjects([]);
    console.log('🧹 Local data cleared');
  }, []);

  // BACKEND DISABLED - Mock retry function
  const retryConnection = useCallback(async () => {
    console.log('📱 Backend disabled - retry not available');
    return { success: false, message: 'Backend disabled - running in offline-only mode' };
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
    retryConnection,
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
    clearAllData,
    retryConnection
  ]);
});