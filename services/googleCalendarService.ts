import { CalendarEvent } from '../types';

class GoogleCalendarService {
    private isSignedIn = false;
    private mockEvents: CalendarEvent[] = [
        { id: 901, date: '2025-10-16', time: '9:00 AM', title: 'Dentist Appointment', tag: 'personal', color: 'red', location: 'Downtown Dental', agentId: 0, source: 'google' },
        { id: 902, date: '2025-10-16', time: '1:00 PM', title: 'Quarterly Financial Review', tag: 'work', color: 'blue', location: 'Zoom', agentId: 0, source: 'google' },
        { id: 903, date: '2025-10-21', time: '6:00 PM', title: 'Dinner with Sarah', tag: 'personal', color: 'purple', location: 'The Italian Place', agentId: 0, source: 'google' },
    ];

    constructor() {
        // Simulate checking for a stored token on initialization
        const storedStatus = localStorage.getItem('googleCalendarConnected');
        this.isSignedIn = storedStatus === 'true';
    }

    async signIn(): Promise<boolean> {
        console.log('[Mock GCal] Starting sign-in...');
        return new Promise(resolve => {
            setTimeout(() => {
                this.isSignedIn = true;
                localStorage.setItem('googleCalendarConnected', 'true');
                console.log('[Mock GCal] User signed in.');
                resolve(true);
            }, 1500); // Simulate network delay and user consent
        });
    }

    async signOut(): Promise<void> {
        this.isSignedIn = false;
        localStorage.removeItem('googleCalendarConnected');
        console.log('[Mock GCal] User signed out.');
    }

    getIsSignedIn(): boolean {
        return this.isSignedIn;
    }

    async listEvents(): Promise<CalendarEvent[]> {
        console.log('[Mock GCal] Fetching events...');
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (!this.isSignedIn) {
                    console.log('[Mock GCal] Fetch failed: User not signed in.');
                    reject(new Error("User is not signed in to Google Calendar."));
                    return;
                }
                console.log('[Mock GCal] Returning mock events.');
                resolve(this.mockEvents);
            }, 1000); // Simulate network delay
        });
    }
}

// Export a singleton instance of the service
export const googleCalendarService = new GoogleCalendarService();