import { CalendarEvent } from '../types';

declare var gapi: any;
declare var google: any;

const CLIENT_ID = '118172916921-valbau851o2fm6vbmvsufgoqgqt3089j.apps.googleusercontent.com';
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
const SCOPES = "https://www.googleapis.com/auth/calendar.events";

class GoogleCalendarService {
    private tokenClient: any = null;
    private initPromise: Promise<void> | null = null;

    init(): Promise<void> {
        if (this.initPromise) return this.initPromise;

        this.initPromise = new Promise((resolve, reject) => {
            if (typeof gapi === 'undefined' || typeof google === 'undefined') {
                 return reject(new Error("Google API scripts not loaded."));
            }

            gapi.load('client', async () => {
                try {
                    // The API key is not required for OAuth 2.0 flows, and the Gemini key
                    // is not valid for the Google Calendar API. Removing it resolves the error.
                    await gapi.client.init({
                        discoveryDocs: DISCOVERY_DOCS,
                    });
                    
                    this.tokenClient = google.accounts.oauth2.initTokenClient({
                        client_id: CLIENT_ID,
                        scope: SCOPES,
                        callback: '', // Will be handled by promise in signIn
                    });
                    resolve();
                } catch (error) {
                    console.error("Error initializing GAPI client", JSON.stringify(error, null, 2));
                    reject(error);
                }
            });
        });
        return this.initPromise;
    }

    getIsSignedIn(): boolean {
        return !!gapi?.client?.getToken();
    }

    async signIn(): Promise<void> {
        if (!this.tokenClient) {
            await this.init();
        }
        return new Promise((resolve, reject) => {
            try {
                this.tokenClient.callback = (resp: any) => {
                    if (resp.error) {
                        return reject(resp);
                    }
                    resolve();
                };
                this.tokenClient.requestAccessToken({ prompt: 'consent' });
            } catch (error) {
                reject(error);
            }
        });
    }

    signOut(): void {
        const token = gapi.client.getToken();
        if (token !== null) {
            google.accounts.oauth2.revoke(token.access_token, () => {});
            gapi.client.setToken(null);
        }
    }

    async listEvents(): Promise<CalendarEvent[]> {
        if (!this.getIsSignedIn()) {
            throw new Error("User is not signed in to Google Calendar.");
        }
        try {
            const response = await gapi.client.calendar.events.list({
                'calendarId': 'primary',
                'timeMin': (new Date()).toISOString(),
                'showDeleted': false,
                'singleEvents': true,
                'maxResults': 15,
                'orderBy': 'startTime'
            });
            
            const events = response.result.items;
            return events.map((item: any): CalendarEvent => {
                const start = item.start.dateTime || item.start.date;
                return {
                    id: item.id,
                    date: start.substring(0, 10),
                    time: item.start.dateTime ? new Date(start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'All Day',
                    title: item.summary,
                    tag: 'google',
                    color: 'blue',
                    location: item.location || (item.hangoutLink ? 'Google Meet' : 'N/A'),
                    agentId: 0,
                    source: 'google',
                };
            });
        } catch (error) {
            console.error("Error fetching Google Calendar events:", error);
            throw new Error("Could not fetch events from Google Calendar.");
        }
    }

    private getNextDay(dateString: string): string {
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(Date.UTC(year, month - 1, day));
        date.setUTCDate(date.getUTCDate() + 1);
        return date.toISOString().split('T')[0];
    }

    async createEvent(summary: string, description: string, date: string): Promise<any> {
        if (!this.getIsSignedIn()) {
            throw new Error("User is not signed in to Google Calendar.");
        }
        try {
            const event = {
                'summary': summary,
                'description': description,
                'start': {
                    'date': date, // YYYY-MM-DD for all-day events
                },
                'end': {
                    'date': this.getNextDay(date), // YYYY-MM-DD, end date is exclusive
                },
            };

            const response = await gapi.client.calendar.events.insert({
                'calendarId': 'primary',
                'resource': event,
            });
            
            return response.result;
        } catch (error) {
            console.error("Error creating Google Calendar event:", error);
            throw new Error("Could not create event in Google Calendar.");
        }
    }
}

export const googleCalendarService = new GoogleCalendarService();