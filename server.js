import express from 'express';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
import { ZoomClient } from './main/lib/zoom-client.js';
import { GoogleOAuthClient } from './main/lib/google-oauth-client.js';
import { db } from './main/lib/database.js';

// Load environment variables
dotenv.config({ path: 'envvars.env' });

const app = express();
app.use(express.json());

// Initialize clients
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const zoomClient = new ZoomClient({
  accountId: process.env.ZOOM_ACCOUNT_ID,
  clientId: process.env.ZOOM_CLIENT_ID,
  clientSecret: process.env.ZOOM_CLIENT_SECRET,
  userEmail: process.env.ZOOM_USER_EMAIL
});

const googleClient = new GoogleOAuthClient({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI
});

// System prompt for Claude
const SYSTEM_PROMPT = `You are a helpful meeting scheduling assistant. You can:
1. Create Zoom meetings
2. Add events to the user's Google Calendar

When a user asks to schedule a meeting:
1. First create the Zoom meeting using create_zoom_meeting
2. Then create a calendar event using create_calendar_event with the Zoom link in the description and location

Be conversational and friendly. Confirm what you've done clearly with all meeting details.`;

// Define the tools Claude can use
const tools = [
  {
    name: "create_zoom_meeting",
    description: "Creates a Zoom meeting and returns join URL, meeting ID, and passcode",
    input_schema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "Meeting title" },
        start_time: { type: "string", description: "ISO 8601 datetime (e.g., 2024-01-23T14:00:00Z)" },
        duration: { type: "number", description: "Duration in minutes" },
        agenda: { type: "string", description: "Meeting agenda" }
      },
      required: ["topic", "start_time", "duration"]
    }
  },
  {
    name: "create_calendar_event",
    description: "Creates a Google Calendar event on the user's personal calendar",
    input_schema: {
      type: "object",
      properties: {
        summary: { type: "string", description: "Event title" },
        start_time: { type: "string", description: "ISO 8601 datetime" },
        end_time: { type: "string", description: "ISO 8601 datetime" },
        description: { type: "string", description: "Event description (include meeting link)" },
        location: { type: "string", description: "Meeting URL or location" }
      },
      required: ["summary", "start_time", "end_time"]
    }
  }
];

// Execute tool calls
async function executeToolCall(toolName, toolInput, userId) {
  console.log(`Executing ${toolName} for user ${userId}`);

  if (toolName === "create_zoom_meeting") {
    return await zoomClient.createMeeting(toolInput);
  }

  if (toolName === "create_calendar_event") {
    const user = db.getUser(userId);
    if (!user || !user.google_access_token) {
      throw new Error('User has not connected Google Calendar');
    }

    return await googleClient.createEventForUser(
      {
        access_token: user.google_access_token,
        refresh_token: user.google_refresh_token
      },
      toolInput
    );
  }

  throw new Error(`Unknown tool: ${toolName}`);
}

// ============ AUTH ROUTES ============

// Get Google OAuth URL
app.get('/auth/google/url', (req, res) => {
  const authUrl = googleClient.getAuthUrl();
  res.json({ authUrl });
});

// Handle OAuth callback
app.get('/auth/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.redirect('/?error=no_code');
    }

    // Exchange code for tokens
    const tokens = await googleClient.getTokensFromCode(code);

    // Get user's email
    const email = await googleClient.getUserEmail(tokens);

    // Save tokens to database
    db.updateGoogleTokens(email, tokens);

    console.log(`✅ User ${email} connected Google Calendar`);
    res.redirect('/?connected=true');
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect('/?error=auth_failed');
  }
});

// Check connection status
app.get('/auth/google/status', (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.json({ connected: false });
  }
  const connected = db.hasGoogleCalendar(userId);
  res.json({ connected });
});

// ============ AGENT ROUTE ============

app.post('/api/agent', async (req, res) => {
  try {
    const { message, userId, conversationHistory = [] } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Check if user has connected Google Calendar
    if (!db.hasGoogleCalendar(userId)) {
      return res.json({
        response: "⚠️ Please connect your Google Calendar first! Click the 'Connect Google Calendar' button.",
        requiresAuth: true
      });
    }

    console.log(`User ${userId} request: ${message}`);

    // Build message history
    const messages = [
      ...conversationHistory,
      { role: "user", content: message }
    ];

    // Initial request to Claude
    let response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: tools,
      messages: messages
    });

    // Handle tool calls (agentic loop)
    while (response.stop_reason === "tool_use") {
      const toolUse = response.content.find(block => block.type === "tool_use");
      console.log(`Claude calling: ${toolUse.name}`);

      // Execute the tool
      const toolResult = await executeToolCall(toolUse.name, toolUse.input, userId);

      // Continue conversation
      messages.push({ role: "assistant", content: response.content });
      messages.push({
        role: "user",
        content: [{
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: JSON.stringify(toolResult)
        }]
      });

      // Get next response
      response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        tools: tools,
        messages: messages
      });
    }

    // Extract final response
    const finalResponse = response.content
      .filter(block => block.type === "text")
      .map(block => block.text)
      .join("\n");

    res.json({ response: finalResponse });

  } catch (error) {
    console.error('Agent error:', error);
    res.status(500).json({
      error: 'Failed to process request',
      message: error.message
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
