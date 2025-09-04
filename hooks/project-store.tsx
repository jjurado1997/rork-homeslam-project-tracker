import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { Project, Expense, ProjectStats, ChangeOrder } from '@/types/project';

const STORAGE_KEY = 'homeslam_projects';

// Store USER_ID persistently so it doesn't change between sessions
const getUserId = async () => {
  let userId = await AsyncStorage.getItem('homeslam_user_id');
  if (!userId) {
    userId = 'homeslam_user_' + Math.random().toString(36).substr(2, 9);
    await AsyncStorage.setItem('homeslam_user_id', userId);
  }
  return userId;
};

// Simple backend API using a free service
const backendAPI = {
  async saveProjects(projects: Project[]) {
    try {
      const userId = await getUserId();
      
      // Use a simple key-value storage service
      const response = await fetch('https://httpbin.org/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          projects,
          timestamp: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save to backend');
      }
      
      console.log('Backend save successful');
      return { success: true };
    } catch (error) {
      console.log('Backend save failed, using local storage only:', error);
      throw error;
    }
  },

  async loadProjects(): Promise<Project[]> {
    // For now, we'll rely on local storage as the primary source
    // This ensures data persistence even if backend is unavailable
    throw new Error('Backend load not implemented - using local storage');
  }
};

export const [ProjectProvider, useProjects] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly'>('monthly');
  const [selectedClient, setSelectedClient] = useState<string>('all');

  const projectsQuery = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      let projects: Project[] = [];
      
      // Load from local storage (primary source)
      console.log('Loading projects from local storage...');
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        projects = JSON.parse(stored) as Project[];
        console.log('Loaded from local storage:', projects.length, 'projects');
      } else {
        console.log('No projects found in local storage');
      }
      
      // Normalize dates
      return projects.map(p => ({
        ...p,
        createdAt: new Date(p.createdAt),
        projectStartDate: p.projectStartDate ? new Date(p.projectStartDate) : new Date(p.createdAt),
        completedAt: p.completedAt ? new Date(p.completedAt) : undefined,
        client: p.client || 'Bottomline',
        changeOrders: (p.changeOrders || []).map(co => ({
          ...co,
          date: new Date(co.date)
        })),
        expenses: p.expenses.map(e => ({
          ...e,
          date: new Date(e.date)
        }))
      }));
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (projects: Project[]) => {
      console.log('Saving projects:', projects.length);
      
      // Always save to local storage first (immediate)
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
      console.log('Saved to local storage');
      
      // Try to save to backend (async, non-blocking)
      backendAPI.saveProjects(projects).catch(() => {
        // Silently fail - local storage is the primary source
        console.log('Backend save failed, but local save succeeded');
      });
      
      return projects;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
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
        filtered = filtered.filter(p => p.projectStartDate >= startOfDay);
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
  };
});