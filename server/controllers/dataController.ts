import { db } from '../db';
// FIX: Added Chargeback to import list to support fetching chargeback data.
import { User, UserRole, Policy, Client, Interaction, Task, License, Testimonial, Notification, PolicyStatus, NotificationType, CalendarEvent, Message, CalendarNote, Chargeback, AICallLog, DayOff } from '../../types';

const checkAndCreateRenewalNotifications = async (policies: Policy[], clients: Client[], notifications: Notification[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const expiringPolicies = policies.filter(p => {
        if (p.status !== PolicyStatus.ACTIVE || !p.endDate) return false;
        try {
            const endDate = new Date(p.endDate);
            // Ensure date is valid before comparison
            if (isNaN(endDate.getTime())) return false;
            return endDate <= thirtyDaysFromNow && endDate >= today;
        } catch (e) {
            return false;
        }
    });

    for (const policy of expiringPolicies) {
        const client = clients.find(c => c.id === policy.clientId);
        if (!client || !client.agentId) continue;

        const agentId = client.agentId;
        const notificationExists = notifications.some(n =>
            n.userId === agentId &&
            n.type === NotificationType.POLICY_RENEWAL &&
            n.message.includes(`Policy #${policy.policyNumber}`)
        );

        if (!notificationExists) {
            await db.createRecord('notifications', {
                userId: agentId,
                type: NotificationType.POLICY_RENEWAL,
                message: `Policy #${policy.policyNumber} for ${client.firstName} ${client.lastName} is expiring on ${policy.endDate}.`,
                timestamp: new Date().toISOString(),
                isRead: false,
                link: `client/${client.id}`
            });
        }
    }
};


export const getAllData = async (currentUser: User) => {
    // Fetch all data in parallel for efficiency
    // FIX: Added chargebacks to data fetching to ensure all app data is available.
    // Messages are no longer fetched here; they are handled in real-time by the client.
    const [
        users, agents, clients, policies, interactions, tasks,
        licenses, calendarNotes, testimonials, initialNotifications, calendarEvents, chargebacks, aiCallLogs,
        daysOff
    ] = await Promise.all([
        db.users.find(),
        db.agents.find(),
        db.clients.find(),
        // FIX: Explicitly provided generic types to db.getAll calls to resolve TypeScript error where types were inferred as 'unknown[]'.
        db.getAll<Policy>('policies'),
        db.getAll<Interaction>('interactions'),
        db.getAll<Task>('tasks'),
        db.getAll<License>('licenses'),
        db.getAll<CalendarNote>('calendarNotes'),
        db.getAll<Testimonial>('testimonials'),
        db.getAll<Notification>('notifications'), // Fetch initial notifications
        db.getAll<CalendarEvent>('calendarEvents'),
        db.getAll<Chargeback>('chargebacks'),
        db.getAll<AICallLog>('ai_calls'),
        db.getAll<DayOff>('daysOff'),
    ]);

    // Check for renewals and create notifications if necessary
    await checkAndCreateRenewalNotifications(policies, clients, initialNotifications);

    // Re-fetch notifications to include any newly created ones in this data load
    // FIX: Explicitly typed the generic db.getAll call.
    const finalNotifications = await db.getAll<Notification>('notifications');

    // Omit passwords from the user list before sending to the client
    const sanitizedUsers = users.map(({ password, ...u }) => u);

    // FIX: Added chargebacks to the returned data object to align with AppData type.
    const allData = {
        users: sanitizedUsers,
        agents, clients, policies, interactions, tasks,
        licenses, notifications: finalNotifications, calendarNotes, testimonials, calendarEvents,
        chargebacks, aiCallLogs, daysOff
    };
    
    // Filter data based on the current user's role
    if (currentUser.role === UserRole.AGENT || currentUser.role === UserRole.SUB_ADMIN) {
        // Agents have further data restrictions
        if (currentUser.role === UserRole.AGENT) {
            const agentClientIds = new Set(allData.clients.filter((c: Client) => c.agentId === currentUser.id).map(c => c.id));
            
            allData.clients = allData.clients.filter((c: Client) => c.agentId === currentUser.id);
            allData.policies = allData.policies.filter((p: Policy) => agentClientIds.has(p.clientId));
            allData.interactions = allData.interactions.filter((i: Interaction) => agentClientIds.has(i.clientId));
            allData.tasks = allData.tasks.filter((t: Task) => t.agentId === currentUser.id || (t.clientId && agentClientIds.has(t.clientId)));
            allData.licenses = allData.licenses.filter((l: License) => l.agentId === currentUser.id);
            allData.testimonials = allData.testimonials.filter((t: Testimonial) => t.agentId === currentUser.id);
            // FIX: Filter chargebacks for the current agent to maintain data security scope.
            allData.chargebacks = allData.chargebacks.filter((c: Chargeback) => c.agentId === currentUser.id);
            allData.calendarNotes = allData.calendarNotes.filter((cn: CalendarNote) => cn.userId === currentUser.id);
        }
    }

    return allData;
};