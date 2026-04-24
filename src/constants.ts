import { Project, Task, Volunteer, Transaction, Campaign } from './types';

export const INITIAL_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'Clean Water Initiative',
    description: 'Providing clean water access to rural areas in Satara.',
    tag: 'Health',
    status: 'active',
    phase: 2,
    progress: 45,
    lead_name: 'Rites Garad',
    budget: '2.4L',
    department: 'Health',
    creator_id: 'system',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Digital Literacy 2026',
    description: 'Teaching web development to underprivileged youth.',
    tag: 'Education',
    status: 'pending_dept_review',
    phase: 1,
    progress: 10,
    lead_name: 'Siddhesh Garad',
    budget: '1.5L',
    department: 'Technology',
    creator_id: 'system',
    created_at: new Date().toISOString(),
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: '101',
    project_id: '1',
    title: 'Site assessment at Satara',
    department: 'Volunteers',
    priority: 'High',
    assigned_to: 'Siddhesh Garad',
    status: 'inprogress',
    task_type: 'execution',
    is_locked: false,
    created_at: new Date().toISOString(),
  }
];

export const INITIAL_VOLUNTEERS: Volunteer[] = [
  { 
    id: '1', 
    name: 'Rites Garad', 
    email: 'riteshgarad4@gmail.com', 
    role: 'Admin', 
    department: 'Admin', 
    skills: ['Leadership', 'Tech'], 
    hours: 120, 
    status: 'Active',
    impactPoints: 500,
    badges: ['Veteran', 'Strategic Lead'],
    joinDate: new Date('2024-01-01').toISOString()
  },
  { 
    id: '2', 
    name: 'Siddhesh Garad', 
    email: 'siddheshgarad02@gmail.com', 
    role: 'Volunteer', 
    department: 'Volunteers', 
    skills: ['Field Ops'], 
    hours: 85, 
    status: 'Active',
    impactPoints: 350,
    badges: ['Rapid Responder'],
    joinDate: new Date('2024-02-15').toISOString()
  },
  { 
    id: '3', 
    name: 'Yukta Garad', 
    email: 'yuktagarad@gmail.com', 
    role: 'Finance', 
    department: 'Finance', 
    skills: ['Accounting'], 
    hours: 45, 
    status: 'Active',
    impactPoints: 150,
    badges: ['Fiscal Integrity'],
    joinDate: new Date('2024-03-10').toISOString()
  }
];

export const TEAM = [
  { name: 'Rites Garad', email: 'riteshgarad4@gmail.com', password: 'password123', role: 'admin' },
  { name: 'Siddhesh Garad', email: 'siddheshgarad02@gmail.com', password: 'password123', role: 'volunteer' },
  { name: 'Abhishek', email: 'abhishek.garadfoundation@gmail.com', password: 'password123', role: 'fundraising' },
  { name: 'Prathamesh Garad', email: 'prathameshgarad08@gmail.com', password: 'password123', role: 'social' },
  { name: 'Yukta Garad', email: 'yuktagarad@gmail.com', password: 'password123', role: 'finance' }
];

export const DEPT_COLORS: Record<string, [string, string]> = {
  'Finance': ['#DBEAFE', '#1E40AF'],
  'Social Media': ['#FEF3C7', '#92400E'],
  'Volunteers': ['#D1FAE5', '#065F46'],
  'PR': ['#EDE9FE', '#5B21B6'],
  'Project Mgmt': ['#FCE7F3', '#9D174D'],
  'Fundraising': ['#FEE2E2', '#991B1B'],
  'Documentation': ['#F3F4F6', '#374151'],
  'General': ['#F1F5F9', '#475569']
};

export const PHASES = ['Needs Assessment', 'Planning', 'Campaign', 'Preparation', 'Execution', 'Documentation'];
