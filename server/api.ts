import * as authController from './controllers/authController';
import * as agentsController from './controllers/agentsController';
import * as leadsController from './controllers/leadsController';
import * as usersController from './controllers/usersController';
import * as messagesController from './controllers/messagesController';
import * as dataController from './controllers/dataController';
import * as auth from './auth';
import { db } from './db';
import { User, UserRole, Policy, Interaction, Task, Message, License, Notification, CalendarNote, Testimonial, PolicyStatus, Chargeback, ChargebackStatus, NotificationType, PolicyUnderwritingStatus, CalendarEvent, DayOff } from '../types';

const SIMULATED_LATENCY = 0; // ms

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
};

const handleProtectedRequest = async (method: string, path: string, body: any, currentUser: User) => {
    // Agent-specific business logic
    const approveAgentMatch = path.match(/^\/api\/agents\/(\d+)\/approve$/);
    if (approveAgentMatch && method === 'POST') {
        return await agentsController.approveAgent(Number(approveAgentMatch[1]), body);
    }
    const agentStatusMatch = path.match(/^\/api\/agents\/(\d+)\/status$/);
    if (agentStatusMatch && method === 'PUT') {
        return await agentsController.updateAgentStatus(Number(agentStatusMatch[1]), body);
    }
    const agentDeleteMatch = path.match(/^\/api\/agents\/(\d+)$/);
     if (agentDeleteMatch && method === 'DELETE') {
        return await agentsController.deleteAgent(Number(agentDeleteMatch[1]));
    }
    
    // Lead/Client business logic
    if (path === '/api/leads/from-profile' && method === 'POST') {
        return await leadsController.createFromProfile(body);
    }

    const onboardingDataMatch = path.match(/^\/api\/clients\/(\d+)\/onboarding-data$/);
    if (onboardingDataMatch && method === 'POST') {
        return await leadsController.saveOnboardingData(Number(onboardingDataMatch[1]), body);
    }

    // User business logic
    if (path === '/api/users/me' && method === 'PUT') {
        return await usersController.updateMyProfile(currentUser.id, body);
    }
    
    // Message business logic
    if (path === '/api/messages/broadcast' && method === 'POST') {
        return await messagesController.broadcastMessage(currentUser, body);
    }
    if (path === '/api/messages/mark-as-read' && method === 'PUT') {
        return await messagesController.markConversationAsRead(currentUser, body);
    }

    const messageActionMatch = path.match(/^\/api\/messages\/(\d+)\/(trash|restore)$/);
    if (messageActionMatch && method === 'PUT') {
        const [, messageId, action] = messageActionMatch;
        if (action === 'trash') {
            return await messagesController.trashMessage(currentUser, Number(messageId));
        }
        if (action === 'restore') {
            return await messagesController.restoreMessage(currentUser, Number(messageId));
        }
    }
    
    if (path === '/api/notifications/mark-all-read' && method === 'PUT') {
        return await messagesController.markAllNotificationsRead(body.userId);
    }

    if (path === '/api/day-off/toggle' && method === 'POST') {
        const { date } = body; // date is 'YYYY-MM-DD'
        const userId = currentUser.id;
        
        const allDaysOff = await db.getAll<DayOff>('daysOff');
        const existingDayOff = allDaysOff.find(d => d.userId === userId && d.date === date);

        if (existingDayOff) {
            // Day off exists, so remove it
            const allEvents = await db.getAll<CalendarEvent>('calendarEvents');
            const correspondingEvent = allEvents.find(e => e.dayOffId === existingDayOff.id);
            if (correspondingEvent) {
                await db.deleteRecord('calendarEvents', correspondingEvent.id);
            }
            return await db.deleteRecord('daysOff', existingDayOff.id);
        } else {
            // Day off does not exist, so create it
            const newDayOff = await db.createRecord<DayOff>('daysOff', { userId, date });
            
            const eventData: Omit<CalendarEvent, 'id'> = {
                date: newDayOff.date,
                time: 'All Day',
                title: `Day Off: ${currentUser.name}`,
                tag: 'personal',
                color: 'red',
                location: 'Out of Office',
                agentId: newDayOff.userId,
                source: 'internal',
                dayOffId: newDayOff.id
            };
            await db.createRecord('calendarEvents', eventData);
            return newDayOff;
        }
    }
    
    if (path === '/api/day-off/batch-add' && method === 'POST') {
        const { dates } = body as { dates: string[] };
        const userId = currentUser.id;
        const allDaysOff = await db.getAll<DayOff>('daysOff');
        const userDaysOff = new Set(allDaysOff.filter(d => d.userId === userId).map(d => d.date));

        const newDaysOff: DayOff[] = [];
        for (const date of dates) {
            if (!userDaysOff.has(date)) {
                const newDayOff = await db.createRecord<DayOff>('daysOff', { userId, date });
                const eventData: Omit<CalendarEvent, 'id'> = {
                    date: newDayOff.date,
                    time: 'All Day',
                    title: `Day Off: ${currentUser.name}`,
                    tag: 'personal',
                    color: 'red',
                    location: 'Out of Office',
                    agentId: newDayOff.userId,
                    source: 'internal',
                    dayOffId: newDayOff.id
                };
                await db.createRecord('calendarEvents', eventData);
                newDaysOff.push(newDayOff);
            }
        }
        return { success: true, created: newDaysOff.length };
    }
    
    if (path === '/api/day-off/batch-delete' && method === 'POST') {
        const { dates } = body as { dates: string[] };
        const userId = currentUser.id;
        
        const allDaysOff = await db.getAll<DayOff>('daysOff');
        const allEvents = await db.getAll<CalendarEvent>('calendarEvents');

        let deletedCount = 0;
        for (const date of dates) {
            const dayOffToDelete = allDaysOff.find(d => d.userId === userId && d.date === date);
            if (dayOffToDelete) {
                const eventToDelete = allEvents.find(e => e.dayOffId === dayOffToDelete.id);
                if (eventToDelete) {
                    await db.deleteRecord('calendarEvents', eventToDelete.id);
                }
                await db.deleteRecord('daysOff', dayOffToDelete.id);
                deletedCount++;
            }
        }
        return { success: true, deleted: deletedCount };
    }

    const resourceMatch = path.match(/^\/api\/([a-zA-Z0-9]+)(?:\/(\d+))?$/);
    if (resourceMatch) {
        const [, resource, idStr] = resourceMatch;
        const id = Number(idStr);

        if (resource === 'calendarNotes') {
            if (method === 'POST') {
                const newNote = await db.createRecord<CalendarNote>(resource, body);
                
                const colorMap: Record<string, CalendarEvent['color']> = { 'Blue': 'blue', 'Green': 'green', 'Yellow': 'orange', 'Red': 'red', 'Purple': 'purple', 'Gray': 'blue' };
                
                const eventTitle = (newNote.reason && newNote.name)
                    ? `${newNote.reason} for ${newNote.name}`
                    : newNote.reason || newNote.text || 'Calendar Note';

                const eventData: Omit<CalendarEvent, 'id'> = {
                    date: newNote.date,
                    time: '12:00 PM',
                    title: eventTitle,
                    tag: 'note',
                    color: colorMap[newNote.color] || 'blue',
                    location: 'Note',
                    agentId: newNote.userId,
                    source: 'internal',
                    noteId: newNote.id
                };
                await db.createRecord('calendarEvents', eventData);

                return newNote;
            }
            if (method === 'PUT' && id) {
                const updatedNote = await db.updateRecord<CalendarNote>(resource, id, body);

                const allEvents = await db.getAll<CalendarEvent>('calendarEvents');
                const correspondingEvent = allEvents.find(e => e.noteId === updatedNote.id);

                if (correspondingEvent) {
                    const colorMap: Record<string, CalendarEvent['color']> = { 'Blue': 'blue', 'Green': 'green', 'Yellow': 'orange', 'Red': 'red', 'Purple': 'purple', 'Gray': 'blue' };
                    
                    const eventTitle = (updatedNote.reason && updatedNote.name)
                        ? `${updatedNote.reason} for ${updatedNote.name}`
                        : updatedNote.reason || updatedNote.text || 'Calendar Note';

                    await db.updateRecord<CalendarEvent>('calendarEvents', correspondingEvent.id, {
                        date: updatedNote.date,
                        title: eventTitle,
                        color: colorMap[updatedNote.color] || 'blue',
                    });
                }
                return updatedNote;
            }
            if (method === 'DELETE' && id) {
                const allEvents = await db.getAll<CalendarEvent>('calendarEvents');
                const correspondingEvent = allEvents.find(e => e.noteId === id);
                if (correspondingEvent) {
                    await db.deleteRecord('calendarEvents', correspondingEvent.id);
                }
                return await db.deleteRecord(resource, id);
            }
        }
        
        if (resource === 'messages') {
             if (method === 'POST') {
                return await messagesController.sendMessage(currentUser, body);
            }
            if (method === 'PUT' && id) {
                return await messagesController.editMessage(currentUser, id, body);
            }
            if (method === 'DELETE' && id) {
                return await messagesController.permanentlyDeleteMessage(currentUser, id);
            }
        }

        if (method === 'POST') {
            if (currentUser.role === UserRole.AGENT && resource === 'clients') body.agentId = currentUser.id;
            // When admin adds an agent, it goes through registration flow now.
            if (resource === 'agents' && currentUser.role === UserRole.ADMIN) {
                const existingUser = await db.users.findByEmail(body.email);
                if (existingUser) throw { status: 409, message: 'An account with this email already exists.' };
                
                const agentUser = await authController.register({
                    name: body.name,
                    email: body.email,
                    password: 'password123', // Default password
                    role: UserRole.AGENT,
                });
                const newAgent = await db.agents.findById(agentUser.user.id);
                if (!newAgent) throw { status: 500, message: "Failed to create agent profile."};
                return await db.updateRecord('agents', newAgent.id, body);
            }
             if (resource === 'policies') {
                const policyResult = await db.createRecord<Policy>(resource, body);
                const client = await db.clients.findById(policyResult.clientId);
                if (client && client.agentId) {
                    const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    await db.createRecord('tasks', {
                        title: 'Follow up with client after policy interaction',
                        agentId: client.agentId,
                        clientId: client.id,
                        completed: false,
                        dueDate: dueDate
                    });
                }
                return policyResult;
            }
            return await db.createRecord(resource, body);
        }
        if (method === 'PUT' && id) {
             if (resource === 'agents') {
                if (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.MANAGER) {
                    throw { status: 403, message: 'Only Admins and Managers can edit agent profiles.' };
                }
                const { role, ...agentData } = body;
                const updatedAgent = await db.updateRecord('agents', id, agentData);
                
                if (role && currentUser.role === UserRole.ADMIN) { // only admin can change role
                    const userToUpdate = await db.users.findById(id);
                    if (userToUpdate && userToUpdate.role !== role) {
                        let title = 'Insurance Agent';
                        switch(role) {
                            case UserRole.SUB_ADMIN: title = 'Lead Manager'; break;
                            case UserRole.MANAGER: title = 'Regional Manager'; break;
                            case UserRole.UNDERWRITING: title = 'Underwriting Specialist'; break;
                            case UserRole.AGENT: default: title = 'Insurance Agent'; break;
                        }
                        await db.users.update(id, { role, title });
                    }
                }
                return updatedAgent;
            }
            if (resource === 'policies') {
                const originalPolicy = await db.getRecordById<Policy>(resource, id);
                if (!originalPolicy) throw { status: 404, message: "Policy not found" };

                const isCancelling = body.status === PolicyStatus.CANCELLED && originalPolicy.status !== PolicyStatus.CANCELLED;
                const isUnderwritingUpdate = body.underwritingStatus && body.underwritingStatus !== originalPolicy.underwritingStatus;

                const policyResult = await db.updateRecord<Policy>(resource, id, body);
                
                if (isUnderwritingUpdate) {
                    const client = await db.clients.findById(policyResult.clientId);
                    if (client && client.agentId) {
                         await db.createRecord<Omit<Notification, 'id'>>('notifications', {
                            userId: client.agentId,
                            type: NotificationType.UNDERWRITING_REVIEWED,
                            message: `Policy #${policyResult.policyNumber} for ${client.firstName} ${client.lastName} was updated to: ${policyResult.underwritingStatus}.`,
                            timestamp: new Date().toISOString(),
                            isRead: false,
                            link: `client/${client.id}`
                        });
                    }
                }

                if (isCancelling) {
                    const startDate = new Date(originalPolicy.startDate);
                    const cancellationDate = new Date();
                    const oneYearLater = new Date(startDate);
                    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

                    if (cancellationDate < oneYearLater) {
                        const client = await db.clients.findById(originalPolicy.clientId);
                        if (client && client.agentId) {
                            const agent = await db.agents.findById(client.agentId);
                            if (agent) {
                                let monthsPaid = (cancellationDate.getFullYear() - startDate.getFullYear()) * 12 + (cancellationDate.getMonth() - startDate.getMonth());
                                monthsPaid = Math.max(0, monthsPaid);

                                const monthsToClawback = Math.max(0, 12 - monthsPaid);
                                
                                if (monthsToClawback > 0) {
                                    const debtAmount = originalPolicy.monthlyPremium * agent.commissionRate * monthsToClawback;
                                    
                                    await db.createRecord<Omit<Chargeback, 'id'>>('chargebacks', {
                                        agentId: agent.id,
                                        clientId: client.id,
                                        clientName: `${client.firstName} ${client.lastName}`,
                                        policyId: originalPolicy.id,
                                        policyType: originalPolicy.type,
                                        policyStartDate: originalPolicy.startDate,
                                        cancellationDate: cancellationDate.toISOString().split('T')[0],
                                        monthsPaid: monthsPaid,
                                        monthlyPremium: originalPolicy.monthlyPremium,
                                        debtAmount: debtAmount,
                                        status: ChargebackStatus.UNPAID,
                                    });
                                    
                                    await db.createRecord<Omit<Notification, 'id'>>('notifications', {
                                        userId: agent.id,
                                        type: NotificationType.CHARGEBACK_ISSUED,
                                        message: `A chargeback of ${formatCurrency(debtAmount)} was issued for ${client.firstName} ${client.lastName}'s policy.`,
                                        timestamp: new Date().toISOString(),
                                        isRead: false,
                                        link: 'chargebacks'
                                    });
                                }
                            }
                        }
                    }
                }


                if (policyResult && !isUnderwritingUpdate) {
                    const client = await db.clients.findById(policyResult.clientId);
                    if (client && client.agentId) {
                         const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                         await db.createRecord('tasks', {
                            title: 'Follow up with client after policy interaction',
                            agentId: client.agentId,
                            clientId: client.id,
                            completed: false,
                            dueDate: dueDate
                         });
                    }
                }
                return policyResult;
            }
            return await db.updateRecord(resource, id, body);
        }
        if (method === 'DELETE' && id) {
            return await db.deleteRecord(resource, id);
        }
    }
    
    if (path === '/api/data' && method === 'GET') {
        return await dataController.getAllData(currentUser);
    }

    throw { status: 404, message: 'API endpoint not found' };
};

export const handleRequest = async (method: string, path: string, body?: any, headers?: any) => {
  return new Promise(async (resolve, reject) => {
    setTimeout(async () => {
      try {
        console.log(`[API Request] ${method} ${path}`, { body });

        if (path.startsWith('/api/auth')) {
          if (path === '/api/auth/login' && method === 'POST') return resolve(await authController.login(body));
          if (path === '/api/auth/register' && method === 'POST') return resolve(await authController.register(body));
          if (path === '/api/auth/verify' && method === 'POST') return resolve(await authController.verifyEmail(body));
          
          if (path === '/api/auth/me' && method === 'GET') {
            const token = headers?.Authorization?.split(' ')[1];
            if (!token) return reject({ status: 401, message: 'No token provided' });
            
            const payload = auth.verify(token);
            if (!payload) return reject({ status: 401, message: 'Invalid token' });

            const currentUser = await db.users.findById(payload.id);
            if (!currentUser) return reject({ status: 401, message: 'User not found' });
            
            return resolve(await authController.getMe(currentUser));
          }
          
          return reject({ status: 404, message: 'Auth endpoint not found' });
        }
        
        const token = headers?.Authorization?.split(' ')[1];
        if (!token) return reject({ status: 401, message: 'No token provided' });
        
        const payload = auth.verify(token);
        if (!payload) return reject({ status: 401, message: 'Invalid token' });

        const currentUser = await db.users.findById(payload.id);
        if (!currentUser) return reject({ status: 401, message: 'User not found' });

        resolve(await handleProtectedRequest(method, path, body, currentUser));

      } catch (error: any) {
        console.error(`[API Error] ${method} ${path}`, error);
        reject({ status: error.status || 500, message: error.message, ...(error.requiresVerification && {requiresVerification: true, user: error.user}), ...(error.requiresApproval && {requiresApproval: true, user: error.user}) });
      }
    }, SIMULATED_LATENCY);
  });
};