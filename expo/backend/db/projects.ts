import { Project, Expense, ChangeOrder } from '@/types/project';
import * as fs from 'fs';
import * as path from 'path';

class ProjectsDatabase {
  private projects: Project[] = [];
  private dataFile: string;

  constructor() {
    // Create data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    this.dataFile = path.join(dataDir, 'projects.json');
    this.loadFromFile();
  }

  private loadFromFile(): void {
    try {
      if (fs.existsSync(this.dataFile)) {
        const data = fs.readFileSync(this.dataFile, 'utf8');
        const parsedData = JSON.parse(data);
        
        // Convert date strings back to Date objects
        this.projects = parsedData.map((p: any) => ({
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
        
        console.log(`💾 Loaded ${this.projects.length} projects from persistent storage`);
      } else {
        console.log('📁 No existing data file found, starting with empty database');
      }
    } catch (error) {
      console.error('❌ Error loading data from file:', error);
      this.projects = [];
    }
  }

  private saveToFile(): void {
    try {
      const dataToSave = JSON.stringify(this.projects, null, 2);
      fs.writeFileSync(this.dataFile, dataToSave, 'utf8');
      console.log(`💾 Saved ${this.projects.length} projects to persistent storage`);
    } catch (error) {
      console.error('❌ Error saving data to file:', error);
    }
  }

  getAll(): Project[] {
    console.log('📊 Backend: Getting all projects:', this.projects.length);
    return this.projects;
  }

  create(project: Project): Project {
    console.log('➕ Backend: Creating project:', project.name);
    this.projects.push(project);
    this.saveToFile();
    return project;
  }

  update(id: string, updates: Partial<Project>): Project | null {
    console.log('✏️ Backend: Updating project:', id);
    const index = this.projects.findIndex(p => p.id === id);
    if (index === -1) {
      console.error('❌ Backend: Project not found:', id);
      return null;
    }
    
    this.projects[index] = { ...this.projects[index], ...updates };
    this.saveToFile();
    console.log('✅ Backend: Project updated:', this.projects[index].name);
    return this.projects[index];
  }

  delete(id: string): boolean {
    console.log('🗑️ Backend: Deleting project:', id);
    const index = this.projects.findIndex(p => p.id === id);
    if (index === -1) {
      console.error('❌ Backend: Project not found:', id);
      return false;
    }
    
    this.projects.splice(index, 1);
    this.saveToFile();
    console.log('✅ Backend: Project deleted');
    return true;
  }

  addExpense(projectId: string, expense: Expense): Project | null {
    console.log('💰 Backend: Adding expense to project:', projectId);
    const project = this.projects.find(p => p.id === projectId);
    if (!project) {
      console.error('❌ Backend: Project not found:', projectId);
      return null;
    }
    
    project.expenses.push(expense);
    this.saveToFile();
    console.log('✅ Backend: Expense added:', expense.description);
    return project;
  }

  updateExpense(projectId: string, expenseId: string, updates: Partial<Expense>): Project | null {
    console.log('✏️ Backend: Updating expense:', expenseId);
    const project = this.projects.find(p => p.id === projectId);
    if (!project) {
      console.error('❌ Backend: Project not found:', projectId);
      return null;
    }
    
    const expenseIndex = project.expenses.findIndex(e => e.id === expenseId);
    if (expenseIndex === -1) {
      console.error('❌ Backend: Expense not found:', expenseId);
      return null;
    }
    
    project.expenses[expenseIndex] = { ...project.expenses[expenseIndex], ...updates };
    this.saveToFile();
    console.log('✅ Backend: Expense updated');
    return project;
  }

  deleteExpense(projectId: string, expenseId: string): Project | null {
    console.log('🗑️ Backend: Deleting expense:', expenseId);
    const project = this.projects.find(p => p.id === projectId);
    if (!project) {
      console.error('❌ Backend: Project not found:', projectId);
      return null;
    }
    
    const expenseIndex = project.expenses.findIndex(e => e.id === expenseId);
    if (expenseIndex === -1) {
      console.error('❌ Backend: Expense not found:', expenseId);
      return null;
    }
    
    project.expenses.splice(expenseIndex, 1);
    this.saveToFile();
    console.log('✅ Backend: Expense deleted');
    return project;
  }

  addChangeOrder(projectId: string, changeOrder: ChangeOrder): Project | null {
    console.log('📋 Backend: Adding change order to project:', projectId);
    const project = this.projects.find(p => p.id === projectId);
    if (!project) {
      console.error('❌ Backend: Project not found:', projectId);
      return null;
    }
    
    if (!project.changeOrders) {
      project.changeOrders = [];
    }
    project.changeOrders.push(changeOrder);
    this.saveToFile();
    console.log('✅ Backend: Change order added:', changeOrder.description);
    return project;
  }

  updateChangeOrder(projectId: string, changeOrderId: string, updates: Partial<ChangeOrder>): Project | null {
    console.log('✏️ Backend: Updating change order:', changeOrderId);
    const project = this.projects.find(p => p.id === projectId);
    if (!project) {
      console.error('❌ Backend: Project not found:', projectId);
      return null;
    }
    
    if (!project.changeOrders) {
      project.changeOrders = [];
    }
    
    const changeOrderIndex = project.changeOrders.findIndex(co => co.id === changeOrderId);
    if (changeOrderIndex === -1) {
      console.error('❌ Backend: Change order not found:', changeOrderId);
      return null;
    }
    
    project.changeOrders[changeOrderIndex] = { ...project.changeOrders[changeOrderIndex], ...updates };
    this.saveToFile();
    console.log('✅ Backend: Change order updated');
    return project;
  }

  deleteChangeOrder(projectId: string, changeOrderId: string): Project | null {
    console.log('🗑️ Backend: Deleting change order:', changeOrderId);
    const project = this.projects.find(p => p.id === projectId);
    if (!project) {
      console.error('❌ Backend: Project not found:', projectId);
      return null;
    }
    
    if (!project.changeOrders) {
      project.changeOrders = [];
    }
    
    const changeOrderIndex = project.changeOrders.findIndex(co => co.id === changeOrderId);
    if (changeOrderIndex === -1) {
      console.error('❌ Backend: Change order not found:', changeOrderId);
      return null;
    }
    
    project.changeOrders.splice(changeOrderIndex, 1);
    this.saveToFile();
    console.log('✅ Backend: Change order deleted');
    return project;
  }
}

export const projectsDb = new ProjectsDatabase();