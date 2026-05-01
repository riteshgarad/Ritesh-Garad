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
  resubmittedAt?: any;
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
  resubmittedAt?: any;
  reviewedBy?: string;
  reviewedAt?: any;
}

export type TaskStatus = 'locked' | 'todo' | 'in_progress' | 'done';
export type TaskCategory = 'Finance' | 'Operations' | 'Marketing' | 'HR' | 'Legal' | 'Social Media' | 'Public Relations' | 'General';

export interface Task {
  id: string;
  projectId: string; // FKey to projects
  projectName?: string;
  assignedDept: TaskCategory;
  assignedVolunteerId?: string;
  assignedVolunteerName?: string;
  relatedDocId?: string; // FKey to documentation
  title: string;
  description: string;
  status: TaskStatus;
  dependencyId?: string; // Links to another Task.id
  impactValue: number; // Adds to Project.progress
  proofRequired: boolean; // Requires file upload to complete
  createdAt: any;
  updatedAt: any;
  completedAt?: any;
  createdBy: string;
  creatorName: string;
  budget?: number; // Optional budget linked to this task
}

export interface ActivityLog {
  id: string;
  type: 'task_completed' | 'project_updated' | 'finance_unlocked' | 'document_verified' | 'system';
  message: string;
  timestamp: any;
  userId?: string;
  userName?: string;
  projectId?: string;
  projectName?: string;
}

export interface Volunteer {
  id: string;
  uid?: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  department: string;
  skills: string[];
  hours: number;
  status: 'Active' | 'Pending' | 'On Break' | 'Ex-Volunteer';
  impactPoints: number;
  badges: string[];
  profileImage?: string;
  idProofUrl?: string;
  availability?: 'Full-time' | 'Weekends' | 'Freelance';
  joinDate: any;
  activeMissions?: string[];
}

export interface WorkLog {
  id: string;
  volunteerId: string;
  volunteerName: string;
  projectId: string;
  projectName: string;
  hours: number;
  description: string;
  date: any;
  status: 'pending' | 'verified' | 'rejected';
  verifiedBy?: string;
  verifiedAt?: any;
}

export interface VolunteerApplication {
  id: string;
  name: string;
  email: string;
  skills: string[];
  availability: string;
  interests: string;
  idProofURL: string;
  status: 'pending_verification' | 'approved' | 'rejected';
  appliedAt: any;
  reviewedBy?: string;
  reviewedAt?: any;
}

export interface VolunteerCertificate {
  id: string;
  volunteerId: string;
  volunteerName: string;
  projectId: string;
  projectName: string;
  issuedAt: any;
  certificateURL: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
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

export type DocumentCategory = 'Invoice' | 'Project_Report' | 'KYC' | 'Legal' | 'Marketing' | 'Mission_Report' | 'Field_Media';

export interface NGODocument {
  id: string;
  fileName: string;
  fileURL: string;
  category: DocumentCategory;
  uploadedBy: string;
  uploaderId: string;
  projectId?: string;
  projectName?: string;
  uploadDate: any;
  description: string;
  status: 'pending' | 'verified' | 'rejected';
  rejectionReason?: string;
  metadata: {
    size: string;
    type: string;
    uploadedAt: any;
  };
  location?: string;
  expiryDate?: any;
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

export interface ExpenseRequest {
  id: string;
  requesterId: string;
  requesterUid?: string;
  requesterName: string;
  requesterEmail: string;
  department: string;
  category?: string;
  amount: number;
  description: string;
  professionalMessage: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  submittedAt: any;
  createdAt?: any;
  reviewedBy?: string;
  reviewedAt?: any;
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

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: 'pending' | 'completed';
  dueDate?: any;
  completedAt?: any;
}

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  timestamp: any;
  read: boolean;
  attachment?: {
    url: string;
    name: string;
    type: string;
    isImage: boolean;
  };
}

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  isActive?: boolean;
}
