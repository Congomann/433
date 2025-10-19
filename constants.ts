// FIX: Add NotificationType to imports to resolve type error.
import { Client, Policy, Interaction, Task, ClientStatus, PolicyType, PolicyStatus, InteractionType, User, UserRole, Agent, Message, AgentStatus, License, LicenseType, Notification, CalendarNote, Testimonial, TestimonialStatus, CalendarEvent, Chargeback, ChargebackStatus, PolicyUnderwritingStatus, NotificationType, AICallLog, DayOff } from './types';
// FIX: Add ShieldIcon to imports to resolve missing component error.
import { ShieldCheckIcon, ShieldIcon, CalendarDaysIcon, SunIcon, ArrowsUpDownIcon, ChartTrendingUpIcon, TruckIcon, CarIcon, WrenchScrewdriverIcon, HomeIcon, BuildingOfficeIcon, FireIcon, StethoscopeIcon } from './components/icons';
import React from 'react';

// Let's assume today is 2024-07-24 for mocking dates.

// NOTE: Passwords for mock users are intentionally omitted.
// For the demo, log in with any of these emails and the password 'password123'.
// Newly registered users will have their passwords stored securely (simulated).
const BASE_MOCK_USERS: User[] = [
    // Default system administrator login. This should remain permanent.
    { id: 1, name: 'Adama Lee', email: 'Support@newhollandfinancial.com', password: 'Support@2025', role: UserRole.ADMIN, avatar: 'https://i.pravatar.cc/150?u=admin', title: 'System Administrator' },
    { id: 2, name: 'Gaius Baltar', email: 'subadmin@newhollandfinancial.com', role: UserRole.SUB_ADMIN, avatar: 'https://i.pravatar.cc/150?u=subadmin', title: 'Lead Manager' },
    { id: 3, name: 'Kara Thrace', email: 'kara.t@newhollandfinancial.com', role: UserRole.AGENT, avatar: 'https://i.pravatar.cc/150?u=agent1', title: 'Senior Agent' },
    { id: 4, name: 'Alex Ray', email: 'alex.r@newhollandfinancial.com', role: UserRole.AGENT, avatar: 'https://picsum.photos/id/237/200/200', title: 'Insurance Agent' },
    { id: 5, name: 'Saul Tigh', email: 'saul.t@newhollandfinancial.com', role: UserRole.AGENT, avatar: 'https://i.pravatar.cc/150?u=agent3', title: 'Insurance Agent' },
    { id: 6, name: 'Laura Roslin', email: 'laura.r@newhollandfinancial.com', role: UserRole.AGENT, avatar: 'https://i.pravatar.cc/150?u=agent4', title: 'Agent Applicant' },
    { id: 7, name: 'William Adama', email: 'william.a@newhollandfinancial.com', role: UserRole.AGENT, avatar: 'https://i.pravatar.cc/150?u=agent5', title: 'Senior Agent' },
    { id: 8, name: 'Karl Agathon', email: 'karl.a@newhollandfinancial.com', role: UserRole.AGENT, avatar: 'https://i.pravatar.cc/150?u=agent6', title: 'Insurance Agent' },
    { id: 9, name: 'Felix Gaeta', email: 'manager@newhollandfinancial.com', role: UserRole.MANAGER, avatar: 'https://i.pravatar.cc/150?u=manager', title: 'Regional Manager' },
    { id: 10, name: 'Tory Foster', email: 'underwriting@newhollandfinancial.com', role: UserRole.UNDERWRITING, avatar: 'https://i.pravatar.cc/150?u=underwriter', title: 'Underwriting Specialist' },
];

const BASE_MOCK_AGENTS: Agent[] = [
    { 
        id: 3, 
        name: 'Kara Thrace', 
        slug: 'kara-thrace',
        avatar: 'https://i.pravatar.cc/150?u=agent1',
        email: 'kara.t@newhollandfinancial.com', 
        leads: 25, 
        clientCount: 1,
        conversionRate: 0.8,
        commissionRate: 0.80,
        location: 'Dallas, TX',
        phone: '(214) 555-1234',
        languages: ['English', 'Spanish'],
        bio: 'Helping families secure their future is my passion. I specialize in life insurance, retirement planning, and protecting what matters most to you.',
        calendarLink: 'https://calendly.com/newholland-kara',
        status: AgentStatus.ACTIVE,
        joinDate: '2024-07-24',
        onboardingStep: 5,
        socials: {
            whatsapp: 'https://wa.me/12145551234',
            linkedin: 'https://linkedin.com/in/karathrace',
            facebook: 'https://facebook.com/karathrace',
            instagram: '',
            tiktok: '',
            twitter: '',
            snapchat: '',
        },
    },
    { 
        id: 4, 
        name: 'Alex Ray',
        slug: 'alex-ray', 
        avatar: 'https://picsum.photos/id/237/200/200',
        email: 'alex.r@newhollandfinancial.com', 
        leads: 30, 
        clientCount: 1,
        conversionRate: 0.75,
        commissionRate: 0.75,
        location: 'Austin, TX',
        phone: '(512) 555-5678',
        languages: ['English'],
        bio: 'I focus on creating customized insurance strategies for small business owners and entrepreneurs. Let\'s build a plan that grows with your business.',
        calendarLink: 'https://calendly.com/newholland-alex',
        status: AgentStatus.ACTIVE,
        joinDate: '2024-07-23',
        onboardingStep: 5,
        socials: {
            whatsapp: '',
            linkedin: 'https://linkedin.com/in/alexray',
            facebook: '',
            instagram: '',
            tiktok: '',
            twitter: '',
            snapchat: '',
        },
    },
    { 
        id: 6, 
        name: 'Laura Roslin', 
        slug: 'laura-roslin',
        avatar: 'https://i.pravatar.cc/150?u=agent4',
        email: 'laura.r@newhollandfinancial.com', 
        leads: 0, 
        clientCount: 0,
        conversionRate: 0,
        commissionRate: 0.75,
        location: 'Caprica City, CAP',
        phone: '(123) 555-0100',
        languages: ['English'],
        bio: 'Eager to begin a new career in helping clients achieve peace of mind through comprehensive insurance solutions.',
        calendarLink: 'https://calendly.com/newholland-laura',
        status: AgentStatus.PENDING,
        joinDate: '',
        onboardingStep: 0,
        socials: {},
    },
    { 
        id: 7, 
        name: 'William Adama', 
        slug: 'william-adama',
        avatar: 'https://i.pravatar.cc/150?u=agent5',
        email: 'william.a@newhollandfinancial.com', 
        leads: 40, 
        clientCount: 15,
        conversionRate: 0.85,
        commissionRate: 0.82,
        location: 'San Antonio, TX',
        phone: '(210) 555-0101',
        languages: ['English'],
        bio: 'A veteran in the insurance industry, committed to providing steadfast guidance and unwavering support to my clients. Specializing in long-term financial planning and family protection.',
        calendarLink: 'https://calendly.com/newholland-william',
        status: AgentStatus.ACTIVE,
        joinDate: '2024-07-23',
        onboardingStep: 5,
        socials: {
            linkedin: 'https://linkedin.com/in/williamadama',
        },
    },
];

const BASE_MOCK_CLIENTS: Client[] = [
    { id: 1, firstName: 'John', lastName: 'Smith', email: 'john.smith@example.com', phone: '555-111-2222', address: '123 Main St', status: ClientStatus.ACTIVE, joinDate: '2023-01-15', agentId: 3, city: 'Dallas', state: 'TX', dob: '1980-05-20', ssn: '***-**-1234' },
    { id: 2, firstName: 'Jane', lastName: 'Doe', email: 'jane.doe@example.com', phone: '555-333-4444', address: '456 Oak Ave', status: ClientStatus.ACTIVE, joinDate: '2023-03-22', agentId: 4, city: 'Austin', state: 'TX', dob: '1992-11-12', ssn: '***-**-5678' },
    { id: 3, firstName: 'Peter', lastName: 'Jones', email: 'peter.jones@example.com', phone: '555-555-6666', address: '789 Pine Ln', status: ClientStatus.LEAD, joinDate: '2024-07-10', agentId: 3, city: 'Plano', state: 'TX' },
    { id: 4, firstName: 'Mary', lastName: 'Williams', email: 'mary.w@example.com', phone: '555-777-8888', address: '101 Maple Dr', status: ClientStatus.INACTIVE, joinDate: '2022-11-01', agentId: 4, city: 'Austin', state: 'TX' },
    { id: 5, firstName: 'David', lastName: 'Brown', email: 'david.b@example.com', phone: '555-999-0000', address: '212 Birch Rd', status: ClientStatus.LEAD, joinDate: '2024-07-20', agentId: undefined, city: 'Houston', state: 'TX' }
];

const BASE_MOCK_POLICIES: Policy[] = [
    { id: 1, clientId: 1, policyNumber: 'WL-JS-001', type: PolicyType.WHOLE_LIFE, monthlyPremium: 150, annualPremium: 1800, startDate: '2023-02-01', endDate: '2070-05-20', status: PolicyStatus.ACTIVE, carrier: 'Mutual of Omaha', underwritingStatus: PolicyUnderwritingStatus.APPROVED },
    { id: 2, clientId: 2, policyNumber: 'AU-JD-002', type: PolicyType.AUTO, monthlyPremium: 120, annualPremium: 1440, startDate: '2023-04-01', endDate: '2024-04-01', status: PolicyStatus.ACTIVE, carrier: 'Transamerica', underwritingStatus: PolicyUnderwritingStatus.APPROVED },
    { id: 3, clientId: 1, policyNumber: 'HO-JS-003', type: PolicyType.HOME, monthlyPremium: 200, annualPremium: 2400, startDate: '2023-02-01', endDate: '2024-02-01', status: PolicyStatus.ACTIVE, carrier: 'Symetra', underwritingStatus: PolicyUnderwritingStatus.PENDING }
];

const BASE_MOCK_INTERACTIONS: Interaction[] = [
    { id: 1, clientId: 1, type: InteractionType.CALL, date: '2024-06-01', summary: 'Discussed policy renewal options.' },
    { id: 2, clientId: 2, type: InteractionType.EMAIL, date: '2024-06-15', summary: 'Sent updated quote for auto insurance.' },
    { id: 3, clientId: 1, type: InteractionType.NOTE, date: '2024-06-02', summary: 'Client is interested in adding a term life policy for spouse.' }
];

const BASE_MOCK_TASKS: Task[] = [
    { id: 1, title: 'Follow up with John Smith', dueDate: '2024-07-28', completed: false, agentId: 3, clientId: 1 },
    { id: 2, title: 'Prepare quote for Peter Jones', dueDate: '2024-07-26', completed: false, agentId: 3, clientId: 3 },
    { id: 3, title: 'Send birthday card to Jane Doe', dueDate: '2024-11-10', completed: true, agentId: 4, clientId: 2 }
];

const BASE_MOCK_MESSAGES: Message[] = [
    { id: 1, senderId: 1, receiverId: 3, text: 'Welcome aboard, Kara! Let me know if you need anything.', timestamp: '2024-07-24T10:00:00Z', status: 'active', source: 'internal', isRead: true, deletedTimestamp: undefined, deletedBy: undefined },
    { id: 2, senderId: 3, receiverId: 1, text: 'Thanks, Adama! Happy to be here.', timestamp: '2024-07-24T10:05:00Z', status: 'active', source: 'internal', isRead: true, deletedTimestamp: undefined, deletedBy: undefined }
];

const BASE_MOCK_LICENSES: License[] = [
    { id: 1, agentId: 3, type: LicenseType.HOME, state: 'TX', licenseNumber: 'TX-12345', expirationDate: '2025-12-31', fileName: 'tx-license.pdf', fileContent: '' }
];

const BASE_MOCK_NOTIFICATIONS: Notification[] = [
    { id: 1, userId: 3, type: NotificationType.LEAD_ASSIGNED, message: 'New lead assigned: Peter Jones', timestamp: '2024-07-24T09:00:00Z', isRead: false, link: 'client/3' }
];

const BASE_MOCK_CALENDAR_NOTES: CalendarNote[] = [
    { id: 1, userId: 3, date: '2024-07-29', text: 'Additional details about the quote discussed.', color: 'Blue', name: 'Peter Jones', phone: '555-555-6666', email: 'peter.jones@example.com', reason: 'Follow-up on IUL Quote' }
];

const BASE_MOCK_TESTIMONIALS: Testimonial[] = [
    { id: 1, agentId: 3, author: 'John S.', quote: 'Kara was amazing! She helped us find the perfect coverage for our family.', status: TestimonialStatus.APPROVED, submissionDate: '2024-05-10' }
];

const BASE_MOCK_DAYS_OFF: DayOff[] = [
    { id: 1, userId: 9, date: '2025-10-20' }, // Manager Felix Gaeta is off
];

const BASE_MOCK_CALENDAR_EVENTS: CalendarEvent[] = [
    { id: 1, date: '2025-10-16', time: '10:00 AM', title: 'Follow-up with Peter Jones', tag: 'lead', color: 'blue', location: 'Phone Call', agentId: 3 },
    { id: 2, date: '2024-07-29', time: '12:00 PM', title: 'Team meeting re: Q3 goals', tag: 'note', color: 'blue', location: 'Note', agentId: 3, noteId: 1 },
    { id: 3, date: '2025-10-20', time: 'All Day', title: 'Day Off: Felix Gaeta', tag: 'personal', color: 'red', location: 'Out of Office', agentId: 9, dayOffId: 1 },
];

const BASE_MOCK_CHARGEBACKS: Chargeback[] = [
    { id: 1, agentId: 4, clientId: 4, clientName: 'Mary Williams', policyId: 2, policyType: PolicyType.AUTO, policyStartDate: '2023-04-01', cancellationDate: '2023-09-15', monthsPaid: 5, monthlyPremium: 120, debtAmount: 630, status: ChargebackStatus.UNPAID }
];

const BASE_MOCK_AI_CALL_LOGS: AICallLog[] = [
    { id: 'call1', name: 'John Smith', phone: '555-111-2222', intent: 'Interested', status: 'Quote provided for age 35 in TX', timestamp: '2024-07-24T14:30:00Z', callRecordingUrl: '/mock/recording1.mp3' },
    { id: 'call2', name: 'Jane Doe', phone: '555-333-4444', intent: 'Callback Requested', status: 'Requested callback tomorrow around noon', timestamp: '2024-07-24T14:35:00Z', callRecordingUrl: '/mock/recording2.mp3' },
    { id: 'call3', name: 'Peter Jones', phone: '555-555-6666', intent: 'Not Interested', status: 'Marked as Do Not Contact', timestamp: '2024-07-24T14:40:00Z' },
];


export const MOCK_USERS = BASE_MOCK_USERS;
export const MOCK_AGENTS = BASE_MOCK_AGENTS;
export const MOCK_CLIENTS = BASE_MOCK_CLIENTS;
export const MOCK_POLICIES = BASE_MOCK_POLICIES;
export const MOCK_INTERACTIONS = BASE_MOCK_INTERACTIONS;
export const MOCK_TASKS = BASE_MOCK_TASKS;
export const MOCK_MESSAGES = BASE_MOCK_MESSAGES;
export const MOCK_LICENSES = BASE_MOCK_LICENSES;
export const MOCK_NOTIFICATIONS = BASE_MOCK_NOTIFICATIONS;
export const MOCK_CALENDAR_NOTES = BASE_MOCK_CALENDAR_NOTES;
export const MOCK_TESTIMONIALS = BASE_MOCK_TESTIMONIALS;
export const MOCK_CALENDAR_EVENTS = BASE_MOCK_CALENDAR_EVENTS;
export const MOCK_CHARGEBACKS = BASE_MOCK_CHARGEBACKS;
export const MOCK_AI_CALL_LOGS = BASE_MOCK_AI_CALL_LOGS;
export const MOCK_DAYS_OFF = BASE_MOCK_DAYS_OFF;


export interface InsuranceService {
    title: string;
    overview: string;
    benefits: string[];
    icon: React.ReactNode;
    category: 'Life' | 'Auto & Commercial' | 'Property & Health';
}

export const INSURANCE_SERVICES: InsuranceService[] = [
    // Life
    // FIX: Replaced JSX with React.createElement to fix parsing errors in a .ts file.
    { title: "Whole Life Insurance", overview: "Permanent coverage that builds cash value over time, offering lifetime protection.", benefits: ["<strong>Lifetime</strong> protection", "Tax-deferred growth", "Borrowing options"], icon: React.createElement(ShieldIcon, { className: "w-8 h-8" }), category: 'Life' },
    // FIX: Replaced JSX with React.createElement to fix parsing errors in a .ts file.
    { title: "Indexed Universal Life (IUL)", overview: "Tied to market indexes like the S&P 500 with downside protection for growth potential.", benefits: ["Market growth potential", "<strong>Living benefits</strong> for illness", "Tax-free loans & retirement income"], icon: React.createElement(ChartTrendingUpIcon, { className: "w-8 h-8" }), category: 'Life' },
    // FIX: Replaced JSX with React.createElement to fix parsing errors in a .ts file.
    { title: "Term Life with Living Benefits", overview: "Affordable coverage for a set period (e.g., 30 years) with access to funds for qualifying illnesses.", benefits: ["High coverage, low cost", "Cash for critical or chronic illness", "Simple protection"], icon: React.createElement(SunIcon, { className: "w-8 h-8" }), category: 'Life' },
    // Auto & Commercial
    // FIX: Replaced JSX with React.createElement to fix parsing errors in a .ts file.
    { title: "Commercial Auto", overview: "Specialized coverage for business vehicles, from single trucks to large fleets.", benefits: ["Liability protection", "Physical damage coverage", "Uninsured motorist coverage"], icon: React.createElement(TruckIcon, { className: "w-8 h-8" }), category: 'Auto & Commercial' },
    // FIX: Replaced JSX with React.createElement to fix parsing errors in a .ts file.
    { title: "Personal Auto", overview: "Comprehensive protection for your everyday car, truck, or SUV.", benefits: ["Collision & comprehensive", "Liability coverage", "Roadside assistance options"], icon: React.createElement(CarIcon, { className: "w-8 h-8" }), category: 'Auto & Commercial' },
    // FIX: Replaced JSX with React.createElement to fix parsing errors in a .ts file.
    { title: "E&O Insurance", overview: "Errors and Omissions coverage to protect your business from professional liability risks.", benefits: ["Covers legal fees", "Protects against negligence claims", "Peace of mind for service providers"], icon: React.createElement(WrenchScrewdriverIcon, { className: "w-8 h-8" }), category: 'Auto & Commercial' },
    // Property & Health
    // FIX: Replaced JSX with React.createElement to fix parsing errors in a .ts file.
    { title: "Homeowners Insurance", overview: "Protect your largest asset—your home—from damage, theft, and liability.", benefits: ["Dwelling coverage", "Personal property protection", "Liability protection"], icon: React.createElement(HomeIcon, { className: "w-8 h-8" }), category: 'Property & Health' },
    // FIX: Replaced JSX with React.createElement to fix parsing errors in a .ts file.
    { title: "Commercial Property", overview: "Safeguard your business's physical assets, including buildings, equipment, and inventory.", benefits: ["Protects against fire, theft, etc.", "Business interruption coverage", "Customizable policies"], icon: React.createElement(BuildingOfficeIcon, { className: "w-8 h-8" }), category: 'Property & Health' },
    // FIX: Replaced JSX with React.createElement to fix parsing errors in a .ts file.
    { title: "Critical Illness", overview: "Provides a lump-sum payment upon diagnosis of a covered critical illness like cancer or a heart attack.", benefits: ["Lump-sum cash payment", "Use funds for any purpose", "Supplements health insurance"], icon: React.createElement(StethoscopeIcon, { className: "w-8 h-8" }), category: 'Property & Health' },
];


export const NOTE_COLORS = [
  { name: 'Blue', bg: 'bg-sky-500', ring: 'ring-sky-500' },
  { name: 'Green', bg: 'bg-emerald-500', ring: 'ring-emerald-500' },
  { name: 'Yellow', bg: 'bg-amber-500', ring: 'ring-amber-500' },
  { name: 'Red', bg: 'bg-rose-500', ring: 'ring-rose-500' },
  { name: 'Purple', bg: 'bg-violet-500', ring: 'ring-violet-500' },
  { name: 'Gray', bg: 'bg-slate-500', ring: 'ring-slate-500' },
];

export const CARRIER_PORTALS = [
    { name: 'Aflac', url: 'https://login.aflac.com/?resume=%2Fas%2FYABmDGAsKQ%2Fresume%2Fas%2Fauthorization.ping&spentity=null' },
    { name: 'Allianz', url: 'https://www.allianzlife.com/Login' },
    { name: 'Americo', url: 'https://account.americoagent.com/Identity/Account/Login/?returnUrl=https%3a%2f%2fportal.americoagent.com%2f' },
    { name: 'Foresters Financial', url: 'https://www.foresters.com/en/login' },
    { name: 'Mutual of Omaha', url: 'https://www.mutualofomaha.com/auth/producer-login' },
    { name: 'Symetra', url: 'https://sso.account.symetra.com/login' },
    { name: 'Transamerica', url: 'https://secure.transamerica.com/login/sign-in/login.html' },
];

export const INSURANCE_CARRIERS = CARRIER_PORTALS.map(c => c.name);