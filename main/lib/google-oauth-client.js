import { google } from 'googleapis';

export class GoogleOAuthClient {
  constructor({ clientId, clientSecret, redirectUri }) {
    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );
  }

  // Generate the URL where users log in with Google
  getAuthUrl() {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/userinfo.email'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  // Exchange authorization code for tokens
  async getTokensFromCode(code) {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }

  // Create calendar event for a specific user
  async createEventForUser(userTokens, eventDetails) {
    this.oauth2Client.setCredentials({
      access_token: userTokens.access_token,
      refresh_token: userTokens.refresh_token
    });

    const calendar = google.calendar({
      version: 'v3',
      auth: this.oauth2Client
    });

    try {
      const response = await calendar.events.insert({
        calendarId: 'primary',
        resource: {
          summary: eventDetails.summary,
          location: eventDetails.location,
          description: eventDetails.description,
          start: {
            dateTime: eventDetails.start_time,
            timeZone: eventDetails.timezone || 'America/Los_Angeles'
          },
          end: {
            dateTime: eventDetails.end_time,
            timeZone: eventDetails.timezone || 'America/Los_Angeles'
          },
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: 24 * 60 },
              { method: 'popup', minutes: 10 }
            ]
          }
        }
      });

      return {
        event_id: response.data.id,
        html_link: response.data.htmlLink,
        summary: response.data.summary,
        start: response.data.start,
        end: response.data.end
      };
    } catch (error) {
      if (error.code === 401) {
        throw new Error('Google Calendar authorization expired. Please reconnect.');
      }
      throw error;
    }
  }

  // Get user's email from Google
  async getUserEmail(tokens) {
    this.oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({
      auth: this.oauth2Client,
      version: 'v2'
    });

    const { data } = await oauth2.userinfo.get();
    return data.email;
  }
}
