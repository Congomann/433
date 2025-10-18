import { Client, Policy, Interaction, Task, ClientStatus, PolicyType, PolicyStatus, InteractionType, User, UserRole, Agent, Message, AgentStatus, License, LicenseType, Notification, CalendarNote, Testimonial, TestimonialStatus, CalendarEvent, Chargeback, ChargebackStatus, PolicyUnderwritingStatus } from './types';
import { ShieldCheckIcon, CalendarDaysIcon, SunIcon, ArrowsUpDownIcon, ChartTrendingUpIcon, TruckIcon, CarIcon, WrenchScrewdriverIcon, HomeIcon, BuildingOfficeIcon, FireIcon, StethoscopeIcon } from './components/icons';
import React from 'react';

// Let's assume today is 2024-07-24 for mocking dates.

// NOTE: Passwords for mock users are intentionally omitted.
// For the demo, log in with any of these emails and the password 'password123'.
// Newly registered users will have their passwords stored securely (simulated).
export const MOCK_USERS: User[] = [
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

export const MOCK_AGENTS: Agent[] = [
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
        socials: {
            linkedin: 'https://linkedin.com/in/williamadama',
        },
    },
    { 
        id: 8, 
        name: 'Karl Agathon',
        slug: 'karl-agathon', 
        avatar: 'https://i.pravatar.cc/150?u=agent6',
        email: 'karl.a@newhollandfinancial.com', 
        leads: 22, 
        clientCount: 8,
        conversionRate: 0.78,
        commissionRate: 0.75,
        location: 'El Paso, TX',
        phone: '(915) 555-0102',
        languages: ['English', 'Spanish'],
        bio: 'Focused on helping young families and professionals navigate their insurance options. I believe in clear communication and building lasting relationships.',
        calendarLink: 'https://calendly.com/newholland-karl',
        status: AgentStatus.ACTIVE,
        joinDate: '2024-07-23',
        socials: {
            twitter: 'https://twitter.com/karlagathon',
        },
    },
];

export const MOCK_TESTIMONIALS: Testimonial[] = [
    { id: 1, agentId: 3, author: 'Maria G.', quote: 'Kara helped me find affordable coverage for my family. I feel so much more secure knowing we’re protected.', status: TestimonialStatus.APPROVED, submissionDate: '2024-07-24' },
    { id: 2, agentId: 3, author: 'David L.', quote: 'Extremely knowledgeable and patient. Kara walked me through all my options without any pressure.', status: TestimonialStatus.APPROVED, submissionDate: '2024-07-23' },
    { id: 5, agentId: 3, author: 'Samuel T.', quote: 'Working with Kara was a breeze. She is very responsive and clearly explained everything. I highly recommend her services!', status: TestimonialStatus.PENDING, submissionDate: '2024-07-24' },
];

export const MOCK_CLIENTS: Client[] = [
  { id: 1, firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', phone: '555-0101', address: '123 Maple St, Springfield, IL', city: 'Springfield', state: 'IL', status: ClientStatus.ACTIVE, joinDate: '2024-07-23', agentId: 3 },
  { id: 3, firstName: 'Alice', lastName: 'Johnson', email: 'alice.j@example.com', phone: '555-0103', address: '789 Pine Ln, Gotham, NJ', city: 'Gotham', state: 'NJ', status: ClientStatus.LEAD, joinDate: '2024-07-23' },
  { id: 5, firstName: 'Charlie', lastName: 'Davis', email: 'charlie.d@example.com', phone: '555-0105', address: '212 Cedar Blvd, Central City, MO', city: 'Central City', state: 'MO', status: ClientStatus.ACTIVE, joinDate: '2024-07-24', agentId: 4 },
  { id: 6, firstName: 'Diana', lastName: 'Prince', email: 'diana.p@example.com', phone: '555-0106', address: '1 Paradise Island, Themyscira', city: 'Themyscira', state: 'DC', status: ClientStatus.LEAD, joinDate: '2024-07-24' },
];

export const MOCK_LICENSES: License[] = [
    { id: 1, agentId: 3, type: LicenseType.HOME, state: 'TX', licenseNumber: 'TX-L123456', expirationDate: '2025-08-15', fileName: 'kara-thrace-tx-license.pdf', fileContent: '' },
    { id: 2, agentId: 3, type: LicenseType.NON_RESIDENT, state: 'CA', licenseNumber: 'CA-L987654', expirationDate: '2024-08-10', fileName: 'kara-thrace-ca-license.pdf', fileContent: '' },
    { id: 4, agentId: 4, type: LicenseType.NON_RESIDENT, state: 'FL', licenseNumber: 'FL-L112233', expirationDate: '2026-11-01', fileName: 'alex-ray-fl-license.pdf', fileContent: '' },
];

export const INSURANCE_CARRIERS: string[] = [
  'Root Insurance Company',
  'Next Insurance US Company',
  'Seaworthy Insurance Co',
  'Accendo Insurance Aetna Health Insurance',
  'Allianz Life Insurance',
  'AFLAC',
  'Americo',
  'Blue Ridge Insurance Co',
  'Bristol West Insurance Company',
  'Continental Life Insurance',
  'Foremost Insurance Co',
  'Gerber Life Insurance Co (Medicare)',
  'Geico',
  'Life Insurance Company of the Southwest',
  'National Life Group',
  'Oak Brook County Mutual Insurance Co',
  'Fidelity & Guaranty Life Insurance Company',
  'Symetra Life Insurance',
  'Transamerica Life Insurance',
];

export const MOCK_POLICIES: Policy[] = [
  { id: 101, clientId: 1, policyNumber: 'AUT-12345', type: PolicyType.AUTO, annualPremium: 1200, monthlyPremium: 100, startDate: '2024-01-15', endDate: '2025-01-15', status: PolicyStatus.ACTIVE, carrier: 'Geico', underwritingStatus: PolicyUnderwritingStatus.APPROVED },
  { id: 102, clientId: 1, policyNumber: 'HOM-67890', type: PolicyType.HOME, annualPremium: 800, monthlyPremium: 66.67, startDate: '2024-07-23', endDate: '2025-07-23', status: PolicyStatus.ACTIVE, carrier: 'Foremost Insurance Co', underwritingStatus: PolicyUnderwritingStatus.PENDING },
  { id: 106, clientId: 5, policyNumber: 'HOM-PQRST', type: PolicyType.HOME, annualPremium: 950, monthlyPremium: 79.17, startDate: '2024-07-24', endDate: '2025-07-24', status: PolicyStatus.ACTIVE, carrier: 'National Life Group', underwritingStatus: PolicyUnderwritingStatus.APPROVED },
];

export const MOCK_INTERACTIONS: Interaction[] = [
  { id: 1, clientId: 1, type: InteractionType.CALL, date: '2024-07-23', summary: 'Discussed renewal options for auto policy.' },
  { id: 2, clientId: 3, type: InteractionType.EMAIL, date: '2024-07-23', summary: 'Sent quote for life insurance.' },
  { id: 3, clientId: 5, type: InteractionType.NOTE, date: '2024-07-24', summary: 'Client mentioned interest in an umbrella policy. Follow up next week.' },
];

export const MOCK_TASKS: Task[] = [
    { id: 1, title: 'Follow up with Alice Johnson', dueDate: '2024-07-28', completed: false, clientId: 3 },
    { id: 2, title: 'Prepare renewal documents for John Doe', dueDate: '2024-07-24', completed: false, clientId: 1, agentId: 3 },
    { id: 4, title: 'Review quarterly performance report', dueDate: '2024-07-30', completed: false },
    { id: 5, title: 'Call Diana Prince about life insurance', dueDate: '2024-07-25', completed: false, clientId: 6, agentId: 4 },
];

export const MOCK_MESSAGES: Message[] = [
    { id: 1, senderId: 1, receiverId: 3, text: 'Hey Kara, how are the new leads looking?', timestamp: '2024-07-23T10:00:00Z', status: 'active', source: 'internal', isRead: true },
    { id: 2, senderId: 3, receiverId: 1, text: 'Looking good! Alice Johnson seems very promising.', timestamp: '2024-07-23T10:05:00Z', status: 'active', source: 'internal', isRead: true },
    { id: 3, senderId: 1, receiverId: 3, text: 'Excellent. Keep me updated.', timestamp: '2024-07-23T10:06:00Z', status: 'active', source: 'internal', isRead: true },
    { id: 4, senderId: 3, receiverId: 1, text: 'Will do.', timestamp: '2024-07-23T10:06:30Z', status: 'active', source: 'internal', isRead: true },
    { id: 5, senderId: 2, receiverId: 1, text: 'I have a new high-priority lead to assign. Who is available?', timestamp: '2024-07-24T09:00:00Z', status: 'active', source: 'internal', isRead: true },
    { id: 6, senderId: 1, receiverId: 2, text: 'Kara Thrace has the most bandwidth right now.', timestamp: '2024-07-24T09:02:00Z', status: 'active', source: 'internal', isRead: true },
    { id: 7, senderId: 4, receiverId: 3, text: 'Can you help me with the paperwork for the Smith policy?', timestamp: '2024-07-24T14:00:00Z', status: 'active', source: 'internal', isRead: false },
];

export const MOCK_CHARGEBACKS: Chargeback[] = [
    { 
        id: 1,
        agentId: 3, 
        clientId: 1, 
        clientName: 'John Doe',
        policyId: 101,
        policyType: PolicyType.AUTO,
        policyStartDate: '2024-01-15',
        cancellationDate: '2024-06-20',
        monthsPaid: 5,
        monthlyPremium: 100,
        debtAmount: 560, // (100 * 0.8 * 7)
        status: ChargebackStatus.UNPAID,
    }
];

export const NOTE_COLORS: { name: string; bg: string; text: string; ring: string; }[] = [
    { name: 'Red', bg: 'bg-rose-100', text: 'text-rose-800', ring: 'ring-rose-500' },
    { name: 'Yellow', bg: 'bg-amber-100', text: 'text-amber-800', ring: 'ring-amber-500' },
    { name: 'Green', bg: 'bg-emerald-100', text: 'text-emerald-800', ring: 'ring-emerald-500' },
    { name: 'Blue', bg: 'bg-sky-100', text: 'text-sky-800', ring: 'ring-sky-500' },
    { name: 'Purple', bg: 'bg-violet-100', text: 'text-violet-800', ring: 'ring-violet-500' },
    { name: 'Gray', bg: 'bg-slate-100', text: 'text-slate-800', ring: 'ring-slate-500' },
];


export const MOCK_CALENDAR_NOTES: CalendarNote[] = [
    { id: 4, userId: 2, date: '2024-07-24', text: 'Review new lead assignments for the week.', color: 'Yellow' },
    { id: 5, userId: 1, date: '2024-07-29', text: 'Quarterly commission payout processing.', color: 'Purple' },
    { id: 6, userId: 3, date: '2024-07-25', text: 'Follow up with Diana Prince.', color: 'Green' },
];

export const MOCK_CALENDAR_EVENTS: CalendarEvent[] = [
  { id: 1, date: '2025-10-15', time: '2:00 PM', title: 'Property Viewing', tag: 'viewing', color: 'purple', location: '456 Oak Ave', agentId: 4 }, // Alex Ray
  { id: 2, date: '2025-10-16', time: '10:00 AM', title: 'Client Meeting - Robert Chen', tag: 'meeting', color: 'blue', location: '123 Main St', agentId: 3 }, // Kara Thrace
  { id: 3, date: '2025-10-16', time: '3:00 PM', title: 'Finalize IUL Policy', tag: 'paperwork', color: 'green', location: 'Office', agentId: 3 },
  { id: 4, date: '2025-10-17', time: '11:00 AM', title: 'Lead Follow-up Call', tag: 'call', color: 'green', location: 'Remote', agentId: 7 },
  { id: 5, date: '2025-10-17', time: '4:00 PM', title: 'Team Sync', tag: 'team', color: 'orange', location: 'Zoom', agentId: 1 },
  { id: 6, date: '2025-10-18', time: '9:00 AM', title: 'New Client Onboarding', tag: 'onboarding', color: 'blue', location: '123 Main St', agentId: 8 },
];


export const MOCK_NOTIFICATIONS: Notification[] = [];

// Data for the insurance solutions cards
export interface InsuranceService {
    category: 'Life' | 'Auto & Commercial' | 'Property & Health';
    title: string;
    overview: string;
    benefits: string[];
    gradient: string;
    icon: React.ReactNode;
}

export const INSURANCE_SERVICES: InsuranceService[] = [
    {
        category: 'Life',
        title: "Whole Life Insurance",
        overview: "Permanent life insurance that provides coverage for your entire life and builds cash value over time, which you can borrow against or use in the future.",
        benefits: [
            "<b>Lifetime Coverage</b> – Your beneficiaries are guaranteed a death benefit.",
            "<b>Cash Value Growth</b> – Accumulates tax-deferred cash value at a guaranteed rate.",
            "<b>Loan Options</b> – Borrow against the cash value for emergencies or investments.",
            "<b>Level Premiums</b> – Premiums remain the same throughout your lifetime.",
            "<b>Financial Security</b> – Provides a foundation for estate planning."
        ],
        gradient: 'from-blue-800 to-indigo-900',
        // FIX: Replaced JSX with React.createElement to be compatible with .ts files.
        icon: React.createElement(ShieldCheckIcon, { className: "w-8 h-8 text-white" })
    },
    {
        category: 'Life',
        title: "Universal Life (UL) Insurance",
        overview: "Offers permanent coverage with flexible premiums and death benefits, allowing you to adjust coverage to fit changing needs.",
        benefits: [
            "<b>Flexible Premiums</b> – Adjust your premium payments to your financial situation.",
            "<b>Adjustable Death Benefit</b> – Increase or decrease coverage as life changes.",
            "<b>Cash Value Growth</b> – Earn interest on the cash value with tax advantages.",
            "<b>Supplement Retirement</b> – Use cash value to supplement income later in life.",
            "<b>Financial Adaptability</b> – Ideal for changing financial obligations."
        ],
        gradient: 'from-sky-700 to-blue-800',
        // FIX: Replaced JSX with React.createElement to be compatible with .ts files.
        icon: React.createElement(ArrowsUpDownIcon, { className: "w-8 h-8 text-white" })
    },
    {
        category: 'Life',
        title: "Indexed Universal Life (IUL)",
        overview: "Lifelong coverage with higher cash value growth potential linked to a stock market index, plus optional living benefits for illness.",
        benefits: [
            "<b>Market-Linked Growth</b> – Cash value can grow based on an index like the S&P 500.",
            "<b>Lifetime Protection</b> – Ensures your loved ones receive a death benefit.",
            "<b>Living Benefits</b> – Access your death benefit early for a qualifying illness.",
            "<b>Flexible Premiums</b> – Adjust coverage and payments to suit your life stage.",
            "<b>Tax Advantages</b> – Cash value grows tax-deferred and can be accessed tax-free."
        ],
        gradient: 'from-indigo-700 to-slate-800',
        // FIX: Replaced JSX with React.createElement to be compatible with .ts files.
        icon: React.createElement(ChartTrendingUpIcon, { className: "w-8 h-8 text-white" })
    },
    {
        category: 'Life',
        title: "Term Life with Living Benefits",
        overview: "Temporary coverage (e.g., 10-30 years) at affordable rates. Living benefits allow you to access funds early if you face a serious illness.",
        benefits: [
            "<b>Affordable Coverage</b> – Lower premiums compared to permanent insurance.",
            "<b>Temporary Protection</b> – Covers obligations like a mortgage or tuition.",
            "<b>Living Benefits</b> – Access funds early for critical, chronic, or terminal illness.",
            "<b>Flexible Terms</b> – Choose term lengths that match your financial goals.",
            "<b>Peace of Mind</b> – Protection during your family's most vulnerable years."
        ],
        gradient: 'from-blue-700 to-blue-900',
        // FIX: Replaced JSX with React.createElement to be compatible with .ts files.
        icon: React.createElement(CalendarDaysIcon, { className: "w-8 h-8 text-white" })
    },
    {
        category: 'Life',
        title: "Final Expense Insurance",
        overview: "A smaller whole life policy designed to cover funeral costs, medical bills, or other end-of-life expenses, reducing the burden on your family.",
        benefits: [
            "<b>Simplified Application</b> – Usually no medical exam required; quick approval.",
            "<b>Affordable Premiums</b> – Smaller coverage amounts make it accessible.",
            "<b>Covers End-of-Life Costs</b> – Ensures funeral and burial expenses are paid for.",
            "<b>Cash Value Accumulation</b> – Policy builds cash value that can be borrowed.",
            "<b>Peace of Mind for Loved Ones</b> – Reduces financial burden on family."
        ],
        gradient: 'from-slate-800 to-slate-900',
        // FIX: Replaced JSX with React.createElement to be compatible with .ts files.
        icon: React.createElement(SunIcon, { className: "w-8 h-8 text-white" })
    },
    {
        category: 'Auto & Commercial',
        title: "Personal Auto Insurance",
        overview: "Covers your personal vehicles against accidents, theft, and other damages, providing financial protection and peace of mind on the road.",
        benefits: [
            "<b>Accident Protection</b> – Covers repair or replacement costs for your vehicle.",
            "<b>Liability Coverage</b> – Protects you if you cause injury or property damage.",
            "<b>Theft & Vandalism</b> – Pays for loss or damage due to theft or vandalism.",
            "<b>Medical Coverage</b> – Covers medical expenses for you and passengers.",
            "<b>Peace of Mind</b> – Ensures financial protection and legal compliance."
        ],
        gradient: 'from-sky-800 to-indigo-900',
        // FIX: Replaced JSX with React.createElement to be compatible with .ts files.
        icon: React.createElement(CarIcon, { className: "w-8 h-8 text-white" })
    },
    {
        category: 'Auto & Commercial',
        title: "Commercial Auto Insurance",
        overview: "Designed for business vehicles, from single vans to large fleets, protecting against accidents, liability, and vehicle damage related to business.",
        benefits: [
            "<b>Business Vehicle Protection</b> – Covers repair or replacement of business vehicles.",
            "<b>Liability Coverage</b> – Protects if an employee causes injury or damage.",
            "<b>Fleet Management Support</b> – Ideal for companies with multiple vehicles.",
            "<b>Optional Add-Ons</b> – Can include roadside assistance and rental reimbursement.",
            "<b>Legal & Financial Security</b> – Protects your business assets."
        ],
        gradient: 'from-blue-800 to-slate-900',
        // FIX: Replaced JSX with React.createElement to be compatible with .ts files.
        icon: React.createElement(TruckIcon, { className: "w-8 h-8 text-white" })
    },
    {
        category: 'Auto & Commercial',
        title: "Errors & Omissions (E&O)",
        overview: "E&O insurance protects businesses and professionals from claims of negligence, mistakes, or failure to deliver services as promised.",
        benefits: [
            "<b>Professional Liability</b> – Covers legal costs if a client claims financial loss.",
            "<b>Covers Settlements</b> – Pays damages or settlements awarded in lawsuits.",
            "<b>Peace of Mind</b> – Focus on business without fear of personal financial loss.",
            "<b>Business Credibility</b> – Shows clients you are serious about protecting them.",
            "<b>Customizable Coverage</b> – Tailored to fit the specific risks of your industry."
        ],
        gradient: 'from-indigo-800 to-indigo-900',
        // FIX: Replaced JSX with React.createElement to be compatible with .ts files.
        icon: React.createElement(WrenchScrewdriverIcon, { className: "w-8 h-8 text-white" })
    },
    {
        category: 'Property & Health',
        title: "Home Insurance",
        overview: "Protects your home and personal belongings from damage, theft, and other unexpected events, providing financial security and peace of mind.",
        benefits: [
            "<b>Property Protection</b> – Covers your home against risks like fire or storms.",
            "<b>Personal Belongings</b> – Protects furniture, electronics, and other valuables.",
            "<b>Liability Protection</b> – Covers injuries to guests on your property.",
            "<b>Temporary Living Expenses</b> – Pays for housing if your home is uninhabitable.",
            "<b>Peace of Mind</b> – Ensures financial stability in case of unexpected events."
        ],
        gradient: 'from-sky-700 to-indigo-800',
        // FIX: Replaced JSX with React.createElement to be compatible with .ts files.
        icon: React.createElement(HomeIcon, { className: "w-8 h-8 text-white" })
    },
    {
        category: 'Property & Health',
        title: "Property Insurance",
        overview: "Provides coverage for physical assets, including rental properties, commercial buildings, and equipment, against damage, theft, or loss.",
        benefits: [
            "<b>Asset Protection</b> – Safeguards buildings, inventory, and equipment.",
            "<b>Business Continuity</b> – Helps cover losses to maintain operations.",
            "<b>Liability Coverage</b> – Protects against third-party claims from accidents.",
            "<b>Customizable Policies</b> – Can include coverage for theft and natural disasters.",
            "<b>Financial Security</b> – Reduces the risk of significant financial loss."
        ],
        gradient: 'from-blue-700 to-slate-800',
        // FIX: Replaced JSX with React.createElement to be compatible with .ts files.
        icon: React.createElement(BuildingOfficeIcon, { className: "w-8 h-8 text-white" })
    },
    {
        category: 'Property & Health',
        title: "Fire Insurance",
        overview: "Specifically covers damages caused by fire to homes, buildings, and other property, helping owners recover their losses quickly.",
        benefits: [
            "<b>Fire Damage Protection</b> – Pays for repair or rebuilding costs after a fire.",
            "<b>Contents Coverage</b> – Covers furniture and other items destroyed by fire.",
            "<b>Business Continuity</b> – Ensures minimal disruption for commercial properties.",
            "<b>Liability Protection</b> – Covers injuries or damages caused by accidental fires.",
            "<b>Peace of Mind</b> – Helps owners recover quickly and avoid financial strain."
        ],
        gradient: 'from-slate-700 to-slate-900',
        // FIX: Replaced JSX with React.createElement to be compatible with .ts files.
        icon: React.createElement(FireIcon, { className: "w-8 h-8 text-white" })
    },
    {
        category: 'Property & Health',
        title: "Critical Illness Insurance",
        overview: "Provides a lump-sum cash payment if diagnosed with a serious illness, helping cover medical costs and lifestyle adjustments.",
        benefits: [
            "<b>Lump-Sum Payout</b> – Receive funds for treatment or living expenses.",
            "<b>Financial Security</b> – Helps cover costs not included in health insurance.",
            "<b>Flexibility</b> – Use the money for medical bills, mortgage, or daily expenses.",
            "<b>Peace of Mind</b> – Reduces financial stress while focusing on recovery.",
            "<b>Supplements Health Insurance</b> – Complements existing medical coverage."
        ],
        gradient: 'from-indigo-700 to-blue-900',
        // FIX: Replaced JSX with React.createElement to be compatible with .ts files.
        icon: React.createElement(StethoscopeIcon, { className: "w-8 h-8 text-white" })
    }
];