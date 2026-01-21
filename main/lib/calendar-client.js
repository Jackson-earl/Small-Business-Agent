// G-Cal Wrapper
// File: google-calendar-client.js
import { google } from 'googleapis';

export class GoogleCalendarClient {
  constructor({ clientId, clientSecret, redirectUri }) {
    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );
    // In production, you'd handle OAuth flow to get user tokens
    // For now, assuming you have a refresh token stored
  }

  setCredentials(tokens) {
    this.oauth2Client.setCredentials(tokens);
  }

  async createEvent({ summary, start, end, description, location }) {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    const event = {
      summary,
      location,
      description,
      start,
      end,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 10 }
        ]
      }
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event
    });

    return {
      event_id: response.data.id,
      html_link: response.data.htmlLink,
      summary: response.data.summary,
      start: response.data.start,
      end: response.data.end
    };
  }
}
