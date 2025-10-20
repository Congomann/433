export enum ClientStatus {
  LEAD = 'Lead',
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

export enum PolicyType {
  WHOLE_LIFE = 'Whole Life',
  UNIVERSAL_LIFE = 'Universal Life',
  INDEXED_UNIVERSAL_LIFE = 'Indexed Universal Life (IUL)',
  FINAL_EXPENSE = 'Final Expense',
  CRITICAL_ILLNESS = 'Critical Illness',
  TERM_LIFE_WLB = 'Term Life WLB',
  TERM_LIFE = 'Term Life',
  HOME = 'Home Insurance',
  AUTO = 'Auto Insurance',
  COMMERCIAL = 'Commercial Insurance',
  PROPERTY = 'Property Insurance',
  E_AND_O = 'E&O Insurance',
  REAL_ESTATE = 'Real Estate Insurance',
  PROPERTY_AND_CASUALTY = 'Property & Casualty',
}

export enum PolicyStatus {
  ACTIVE = 'Active',
  EXPIRED = 'Expired',
  CANCELLED = 'Cancelled',
}

export enum PolicyUnderwritingStatus {
  PENDING = 'Pending Review',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  MORE_INFO_REQUIRED = 'More Info Required',
}

export enum InteractionType {
  CALL = 'Call',
  EMAIL = 'Email',
  MEETING = 'Meeting',
  NOTE = 'Note',
}

export enum UserRole {
  ADMIN = 'Admin',
  SUB_ADMIN = 'Sub-Admin',
  AGENT = 'Agent',
  MANAGER = 'Manager',
  UNDERWRITING = 'Underwriting',
}

export enum AgentStatus {
    PENDING = 'Pending',
    ACTIVE = 'Active',
    INACTIVE = 'Inactive',
}

export enum LicenseType {
    HOME = 'Home State License',
    NON_RESIDENT = 'Non-Resident License',
}

export enum TestimonialStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
}

export enum NotificationType {
  LEAD_ASSIGNED = 'lead_assigned',
  TASK_DUE = 'task_due',
  AGENT_APPROVED = 'agent_approved',
  BROADCAST = 'broadcast',
  POLICY_RENEWAL = 'policy_renewal',
  CHARGEBACK_ISSUED = 'chargeback_issued',
  UNDERWRITING_REVIEWED = 'underwriting_reviewed',
  GENERIC = 'generic',
}

export enum ChargebackStatus {
  UNPAID = 'Unpaid',
  PAID = 'Paid',
  ADJUSTED = 'Adjusted',
}

export interface Chargeback {
  id: number;
  agentId: number;
  clientId: number;
  clientName: string;
  policyId: number;
  policyType: PolicyType;
  policyStartDate: string;
  cancellationDate: string;
  monthsPaid: number;
  monthlyPremium: number;
  debtAmount: number;
  status: ChargebackStatus;
}

export interface User {
  id: number;
  name: string;
  email: string;
  // NOTE: In a real application, NEVER store passwords in plaintext. This is for simulation only.
  password?: string;
  role: UserRole;
  avatar: string;
  title: string;
  isVerified?: boolean;
  verificationCode?: string;
}

export interface Agent {
    id: number;
    name: string;
    slug: string;
    email: string;
    leads: number;
    clientCount: number;
    conversionRate: number;
    commissionRate: number;
    location: string;
    phone: string;
    languages: string[];
    bio: string;
    calendarLink: string;
    avatar: string;
    status: AgentStatus;
    joinDate: string;
    onboardingStep?: number;
    socials: {
        whatsapp?: string;
        linkedin?: string;
        facebook?: string;
        tiktok?: string;
        instagram?: string;
        twitter?: string;
        snapchat?: string;
    };
}

export interface License {
    id: number;
    agentId: number;
    type: LicenseType;
    state: string; // e.g., 'TX'
    licenseNumber: string;
    expirationDate: string; // YYYY-MM-DD
    fileName: string; // name of the uploaded file
    fileContent: string; // Base64 encoded file content
}


export interface Client {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  status: ClientStatus;
  joinDate: string;
  agentId?: number;

  // Detailed lead info - optional for existing clients
  dob?: string;
  ssn?: string;
  bankName?: string;
  accountNumber?: string;
  routingNumber?: string;
  accountType?: 'Checking' | 'Saving';
  monthlyPremium?: number;
  annualPremium?: number;
  city?: string;
  state?: string;
  
  // New fields for sub-admin lead creation
  height?: string;
  weight?: number;
  birthState?: string;
  medications?: string;
}


export interface Policy {
  id: number;
  clientId: number;
  policyNumber: string;
  type: PolicyType;
  monthlyPremium: number;
  annualPremium: number;
  startDate: string;
  endDate: string;
  status: PolicyStatus;
  carrier?: string;
  underwritingStatus?: PolicyUnderwritingStatus;
  underwritingNotes?: string;
}

export interface Interaction {
  id: number;
  clientId: number;
  type: InteractionType;
  date: string;
  summary: string;
}

export interface Task {
  id: number;
  title: string;
  dueDate: string;
  completed: boolean;
  clientId?: number;
  agentId?: number;
}

export interface Notification {
  id: number;
  userId: number; // The user who receives the notification
  type: NotificationType;
  message: string;
  timestamp: string;
  isRead: boolean;
  link: string; // The view to navigate to, e.g., 'client/5'
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message: string;
}

export interface CalendarNote {
  id: number;
  userId: number;
  date: string; // YYYY-MM-DD
  text: string;
  color: string; // e.g., 'Blue', 'Green', 'Red'
  name?: string;
  phone?: string;
  email?: string;
  reason?: string;
}

export interface DayOff {
  id: number;
  userId: number;
  date: string; // YYYY-MM-DD
}

export interface CalendarEvent {
  id: number;
  date: string; // YYYY-MM-DD
  time: string; // e.g., '10:00 AM' or 'All Day'
  title: string;
  tag: string;
  color: 'blue' | 'purple' | 'green' | 'orange' | 'red';
  location: string;
  agentId: number;
  source?: 'internal' | 'google';
  noteId?: number;
  dayOffId?: number;
}

export interface Testimonial {
  id: number;
  agentId: number;
  author: string; // e.g., 'Maria G.'
  quote: string;
  status: TestimonialStatus;
  submissionDate: string; // YYYY-MM-DD
}

export type AISuggestionActionType = 'CREATE_TASK' | 'DRAFT_EMAIL' | 'ASSIGN_LEAD' | 'INFO_ONLY';

export interface AISuggestionAction {
  type: AISuggestionActionType;
  clientId?: number;
  prompt?: string;
  assignToAgentId?: number;
  assignToAgentName?: string;
}

export interface AISuggestion {
  priority: 'High' | 'Medium' | 'Low';
  title: string;
  description: string;
  action: AISuggestionAction;
}

export interface EmailDraft {
  to: string;
  clientName: string;
  subject: string;
  body: string;
}

export interface AICallAnalysis {
  summary: string;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  keywords: string[];
  actionItems: string[];
}

export interface AICallLog {
  id: string; // Firestore document ID
  name: string;
  phone: string;
  intent: 'Interested' | 'Not Interested' | 'Callback Requested' | 'Unknown';
  status: string; // e.g., "Quote provided for age 35 in TX", "Callback at 2024-08-01T14:00:00"
  timestamp: string;
  callRecordingUrl?: string;
}

export interface AppData {
    users: User[];
    agents: Agent[];
    clients: Client[];
    policies: Policy[];
    interactions: Interaction[];
    tasks: Task[];
    licenses: License[];
    notifications: Notification[];
    calendarNotes: CalendarNote[];
    testimonials: Testimonial[];
    calendarEvents: CalendarEvent[];
    chargebacks: Chargeback[];
    aiCallLogs: AICallLog[];
    daysOff: DayOff[];
}