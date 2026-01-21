// Zoom API wrapper

import axios from 'axios';

export class ZoomClient {
  constructor({ accountId, clientId, clientSecret }) {
    this.accountId = accountId;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.accessToken = null;
  }

  async getAccessToken() {
    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    
    const response = await axios.post(
      'https://zoom.us/oauth/token',
      new URLSearchParams({
        grant_type: 'account_credentials',
        account_id: this.accountId
      }),
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    this.accessToken = response.data.access_token;
    return this.accessToken;
  }

  async createMeeting({ topic, start_time, duration, agenda }) {
    if (!this.accessToken) {
      await this.getAccessToken();
    }

    const response = await axios.post(
      'https://api.zoom.us/v2/users/me/meetings',
      {
        topic,
        type: 2, // Scheduled meeting
        start_time,
        duration,
        agenda,
        settings: {
          join_before_host: true,
          mute_upon_entry: false
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      meeting_id: response.data.id,
      join_url: response.data.join_url,
      passcode: response.data.password,
      start_time: response.data.start_time,
      topic: response.data.topic
    };
  }
}
