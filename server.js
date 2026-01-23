import express from 'express';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
import { ZoomClient } from './main/lib/zoom-client.js';
import { GoogleCalendarClient } from './main/lib/calendar-client.js';

// Load environment variables from envvars.env
dotenv.config({ path: 'envvars.env' });

const app = express();
app.use(express.json());

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Initialize service clients
const zoomClient = new ZoomClient({
  accountId: process.env.ZOOM_ACCOUNT_ID,
  clientId: process.env.ZOOM_CLIENT_ID,
  clientSecret: process.env.ZOOM_CLIENT_SECRET
});

const calendarClient = new GoogleCalendarClient({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI
});

// System prompt for Claude
const SYSTEM_PROMPT = `You are a helpful meeting scheduling assistant. You can:
1. Create Zoom meetings
2. Add events to Google Calendar
3. Coordinate both to ensure calendar events include meeting links

When a user asks to schedule a meeting:
1. First create the Zoom meeting
2. Then create a calendar event with the Zoom link in the description and location

Be conversational and friendly. Confirm what you've done clearly.`;

// Define the tools Claude can use
const tools = [
  {
    name: "create_zoom_meeting",
    description: "Creates a new Zoom meeting. Returns meeting URL, ID, and passcode.",
    input_schema: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          description: "Meeting title/topic"
        },
        start_time: {
          type: "string",
          description: "ISO 8601 datetime (e.g., 2024-01-15T14:00:00Z)"
        },
        duration: {
          type: "number",
          description: "Duration in minutes"
        },
        agenda: {
          type: "string",
          description: "Meeting agenda or description"
        }
      },
      required: ["topic", "start_time", "duration"]
    }
  },
  {
    name: "create_calendar_event",
    description: "Creates a new Google Calendar event",
    input_schema: {
      type: "object",
      properties: {
        summary: {
          type: "string",
          description: "Event title"
        },
        start_time: {
          type: "string",
          description: "ISO 8601 datetime"
        },
        end_time: {
          type: "string",
          description: "ISO 8601 datetime"
        },
        description: {
          type: "string",
          description: "Event description (can include meeting links)"
        },
        location: {
          type: "string",
          description: "Event location or meeting URL"
        }
      },
      required: ["summary", "start_time", "end_time"]
    }
  }
];

// Handle tool execution
async function executeToolCall(toolName, toolInput) {
  switch (toolName) {
    case "create_zoom_meeting":
      return await zoomClient.createMeeting({
        topic: toolInput.topic,
        start_time: toolInput.start_time,
        duration: toolInput.duration,
        agenda: toolInput.agenda
      });

    case "create_calendar_event":
      return await calendarClient.createEvent({
        summary: toolInput.summary,
        start: { dateTime: toolInput.start_time },
        end: { dateTime: toolInput.end_time },
        description: toolInput.description,
        location: toolInput.location
      });

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

// API endpoint
app.post('/api/agent', async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;

    // Build message history for Claude
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

      console.log(`Executing tool: ${toolUse.name}`);

      // Execute the tool
      const toolResult = await executeToolCall(toolUse.name, toolUse.input);

      // Send tool result back to Claude
      messages.push({ role: "assistant", content: response.content });
      messages.push({
        role: "user",
        content: [{
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: JSON.stringify(toolResult)
        }]
      });

      // Get next response from Claude
      response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        tools: tools,
        messages: messages
      });
    }

    // Extract final text response
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
