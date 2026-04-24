export interface BudgetItem {
  item: string;
  cost: number;
}

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
  budget_items?: BudgetItem[];
  rejection_reason?: string;
  budget_rejection_reason?: string;
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
  status: 'pending' | 'approved' | 'rejected';
}

export interface BudgetRequest {
  id: string;
  projectId: string;
  projectName: string;
  proposerId: string;
  proposedBy: string;
  department: string;
  itemizedList: BudgetItem[];
  totalAmount: number;
  status: 'pending_finance' | 'approved' | 'rejected';
  rejectionReason?: string;
  submittedAt: any;
  reviewedBy?: string;
  reviewedAt?: any;
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
  reviewedBy?: string;
  reviewedAt?: any;
  rejectionReason?: string;
}

export type CampaignStatus = 'draft' | 'pending_head' | 'pending_admin' | 'active' | 'completed';

export interface Campaign {
  id: string;
  title: string;
  description: string;
  goal_amount: number;
  current_raised: number;
  status: CampaignStatus;
  media_urls: string[];
  impact_story_id?: string; // Reference to projects collection
  created_at: any;
  created_by: string;
  rejection_reason?: string;
  category: string;
}

export interface Donor {
  id: string;
  name: string;
  email: string;
  total_donated: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  last_donation_date: any;
  frequency: 'one-time' | 'monthly' | 'yearly';
  join_date: any;
}

export interface Donation {
  id: string;
  donor_id: string;
  amount: number;
  campaign_id: string;
  is_recurring: boolean;
  status: 'captured' | 'failed';
  donor_visibility: 'public' | 'anonymous';
  timestamp: any;
  payment_method: string;
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
  uid: string;
  name: string;
  email: string;
  role: string;
  department?: string;
}
