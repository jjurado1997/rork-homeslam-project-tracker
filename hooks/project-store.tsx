import createContextHook from '@nkzw/create-context-hook';
import { useQueryClient } from '@tanstack/react-query';
import { useState, useMemo, useCallback } from 'react';
import { Project, Expense, ProjectStats, ChangeOrder } from '@/types/project';
import { trpc } from '@/lib/trpc';



export const [ProjectProvider, useProjects] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly'>('monthly');
  const [selectedClient, setSelectedClient] = useState<string>('all');


  // Use tRPC to get projects from backend
  const projectsQuery = trpc.projects.getAll.useQuery(undefined, {
    retry: (failureCount, error) => {
      console.log(`🔄 Backend query retry attempt ${failureCount}:`, error);
      return failureCount < 2;
    },
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

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

  const projects = useMemo(() => projectsQuery.data || [], [projectsQuery.data]);

  // Updated functions to use backend
  const addProject = useCallback((project: Omit<Project, 'id' | 'createdAt' | 'expenses' | 'isCompleted' | 'changeOrders'>) => {
    console.log('🚀 Adding project to backend:', project.name);
    createProjectMutation.mutate({
      name: project.name,
      address: project.address || '',
      client: project.client,
      totalRevenue: project.totalRevenue,
      projectStartDate: project.projectStartDate.toISOString(),
      notes: project.notes || ''
    });
  }, [createProjectMutation]);

  const updateProject = useCallback((projectId: string, updates: Partial<Project>) => {
    console.log('🚀 Updating project in backend:', projectId);
    const backendUpdates: any = { ...updates };
    if (updates.projectStartDate) {
      backendUpdates.projectStartDate = updates.projectStartDate.toISOString();
    }
    if (updates.completedAt) {
      backendUpdates.completedAt = updates.completedAt.toISOString();
    }
    updateProjectMutation.mutate({ id: projectId, updates: backendUpdates });
  }, [updateProjectMutation]);

  const deleteProject = useCallback((projectId: string) => {
    console.log('🚀 Deleting project from backend:', projectId);
    deleteProjectMutation.mutate({ id: projectId });
  }, [deleteProjectMutation]);

  const addExpense = useCallback((projectId: string, expense: Omit<Expense, 'id' | 'date'>) => {
    console.log('🚀 Adding expense to backend:', expense.description);
    createExpenseMutation.mutate({
      projectId,
      category: expense.category,
      subcategory: expense.subcategory,
      amount: expense.amount,
      description: expense.description || ''
    });
  }, [createExpenseMutation]);

  const updateExpense = useCallback((projectId: string, expenseId: string, updates: Partial<Omit<Expense, 'id' | 'date'>>) => {
    console.log('🚀 Updating expense in backend:', expenseId);
    updateExpenseMutation.mutate({ projectId, expenseId, updates });
  }, [updateExpenseMutation]);

  const deleteExpense = useCallback((projectId: string, expenseId: string) => {
    console.log('🚀 Deleting expense from backend:', expenseId);
    deleteExpenseMutation.mutate({ projectId, expenseId });
  }, [deleteExpenseMutation]);

  const completeProject = useCallback((projectId: string) => {
    console.log('🚀 Completing project in backend:', projectId);
    updateProjectMutation.mutate({ 
      id: projectId, 
      updates: { 
        isCompleted: true, 
        completedAt: new Date().toISOString() 
      } 
    });
  }, [updateProjectMutation]);

  const reopenProject = useCallback((projectId: string) => {
    console.log('🚀 Reopening project in backend:', projectId);
    updateProjectMutation.mutate({ 
      id: projectId, 
      updates: { 
        isCompleted: false, 
        completedAt: null 
      } 
    });
  }, [updateProjectMutation]);

  const addChangeOrder = useCallback((projectId: string, changeOrder: Omit<ChangeOrder, 'id' | 'date'>) => {
    console.log('🚀 Adding change order to backend:', changeOrder.description);
    createChangeOrderMutation.mutate({
      projectId,
      description: changeOrder.description,
      amount: changeOrder.amount,
      approved: changeOrder.approved
    });
  }, [createChangeOrderMutation]);

  const updateChangeOrder = useCallback((projectId: string, changeOrderId: string, updates: Partial<Omit<ChangeOrder, 'id' | 'date'>>) => {
    console.log('🚀 Updating change order in backend:', changeOrderId);
    updateChangeOrderMutation.mutate({ projectId, changeOrderId, updates });
  }, [updateChangeOrderMutation]);

  const deleteChangeOrder = useCallback((projectId: string, changeOrderId: string) => {
    console.log('🚀 Deleting change order from backend:', changeOrderId);
    deleteChangeOrderMutation.mutate({ projectId, changeOrderId });
  }, [deleteChangeOrderMutation]);

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

  return useMemo(() => ({
    projects: filteredProjects,
    allProjects: projects,
    isLoading: projectsQuery.isLoading,
    error: projectsQuery.error,
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
    clearAllData: useCallback(() => {
      console.log('🧹 Backend data cannot be cleared from client');
    }, []),
  }), [
    filteredProjects,
    projects,
    projectsQuery.isLoading,
    projectsQuery.error,
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
    calculateStats
  ]);
});