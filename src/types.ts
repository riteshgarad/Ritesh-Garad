export interface Project {
  id: string;
  name: string;
  description: string;
  tag: 'Health' | 'Education' | 'Environment' | 'Community' | 'Technology';
  status: 'pending_dept_review' | 'pending_admin_review' | 'approved' | 'rejected' | 'active' | 'completed' | 'on_hold';
  phase: number;
  progress: number;
  lead_name: string;
  budget: string;
  budget_status?: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  timeline?: string;
  department: string;
  created_at: any;
  creator_id: string;
}

export interface FinanceRequest {
  id: string;
  project_id: string;
  project_name: string;
  amount: string;
  requested_at: any;
  status: 'pending' | 'disbursed' | 'rejected';
}

export interface Task {
  id: string;
  project_id?: string;
  title: string;
  department: string;
  priority: 'High' | 'Medium' | 'Low';
  assigned_to: string;
  due_date?: string;
  status: 'todo' | 'inprogress' | 'completed';
  task_type: 'execution' | 'approval';
  is_locked: boolean;
  decision?: 'approved' | 'rejected';
  created_at: string;
}

export interface Volunteer {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  skills: string;
  hours: number;
  status: 'Active' | 'Inactive';
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  projectID?: string;
  donationType?: 'One-time' | 'Monthly' | 'Corporate' | 'In-kind' | 'N/A';
  expenditureType?: 'Procurement' | 'Travel' | 'Event Setup' | 'Marketing' | 'N/A';
  paymentMethod: 'Bank Transfer' | 'Cash' | 'UPI' | 'Online Gateway';
  status: 'pending' | 'approved' | 'rejected' | 'cleared';
  receiptURL?: string;
  date: any; // Firestore Timestamp
  createdBy: string;
}

export interface Campaign {
  id: string;
  name: string;
  goal: number;
  raised: number;
  end_date: string;
  status: 'active' | 'completed';
}

export interface AppNotification {
  id: string;
  type: 'deadline' | 'milestone' | 'system' | 'approval';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  relatedId?: string; // task or project ID
}

export interface AppUser {
  name: string;
  email: string;
  role: string;
  department?: string;
}
