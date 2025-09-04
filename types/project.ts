export interface Expense {
  id: string;
  category: ExpenseCategory;
  subcategory: string;
  amount: number;
  description?: string;
  date: Date;
}

export interface ChangeOrder {
  id: string;
  description: string;
  amount: number;
  date: Date;
  approved: boolean;
}

export type ExpenseCategory = 'materials' | 'contractors' | 'labor' | 'landscaping' | 'other';

export interface ExpenseSubcategory {
  materials: string[];
  contractors: string[];
  labor: string[];
  landscaping: string[];
  other: string[];
}

export const CLIENTS = [
  'Bottomline',
  'Talley',
  'TouchPoint',
  'Movezen',
  'Resi Pro',
  'Sunnon',
  'T. R. Lawing Realty',
  'Dembeck Realty',
  'Peter Mehta',
  'Delta Operating Management',
  'Invitation Homes'
] as const;

export type Client = typeof CLIENTS[number];

export const EXPENSE_SUBCATEGORIES: ExpenseSubcategory = {
  materials: [
    'Amazon',
    'Home Depot',
    'Lowes',
    'Appliances',
    'Paint',
    'Miscellaneous'
  ],
  contractors: [
    'HVAC',
    'Painters',
    'Flooring',
    'Concrete',
    'Framers',
    'Refurbish',
    'Plumber',
    'Electrician',
    'Carpenters',
    'Countertops',
    'Carpet Cleaners',
    'Cleaning',
    'Roofer',
    'Fireplace',
    'Window',
    'Trash Haul',
    'Garage Service'
  ],
  labor: ['Luis', 'Freddy', 'Edwin', 'Samuel', 'Danny', 'Armando', 'Bonus'],
  landscaping: [
    'Landscaper',
    'Plants & Trees',
    'Mulch & Soil',
    'Irrigation',
    'Hardscaping',
    'Lawn Care',
    'Garden Supplies'
  ],
  other: ['Gas', 'Permits', 'Insurance']
};

export interface Project {
  id: string;
  name: string;
  address?: string;
  client: string;
  totalRevenue: number;
  changeOrders?: ChangeOrder[];
  expenses: Expense[];
  createdAt: Date;
  projectStartDate: Date;
  completedAt?: Date;
  isCompleted: boolean;
  notes?: string;
}

export interface ProjectStats {
  totalRevenue: number;
  totalChangeOrders: number;
  totalExpenses: number;
  profit: number;
  profitMargin: number;
  laborPercentage: number;
}