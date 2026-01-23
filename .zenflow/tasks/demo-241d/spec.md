# Technical Specification: Demo Setup

## Task Overview
**Difficulty**: Easy

The user wants to see the Meeting Assistant application running in a browser. This requires setting up a minimal development environment to serve the React frontend and Node.js backend.

## Technical Context

### Language & Framework
- **Frontend**: React (JSX) with inline styles
- **Backend**: Node.js with ES modules
- **Dependencies required**:
  - `react`, `react-dom` - UI framework
  - `@anthropic-ai/sdk` - Claude API client
  - `axios` - HTTP client for Zoom API
  - `googleapis` - Google Calendar API

### Current Project Structure
```
main/
├── MeetingAssistant.jsx       # React chat widget component
├── api/
│   └── agent.js               # Claude-powered backend API
└── lib/
    ├── calendar-client.js     # Google Calendar wrapper
    └── zoom-client.js         # Zoom API wrapper
```

## Implementation Approach

To demo this project in a browser, we need to:

1. **Set up a React development environment** - Use Vite (fast, modern bundler) to serve the React component
2. **Create an entry point** - Add `index.html` and `main.jsx` to mount the React app
3. **Set up the backend API** - Use Express.js to serve the `/api/agent` endpoint
4. **Configure environment variables** - Load from `envvars.env`

### Recommended Stack for Demo
- **Vite** - For React development server (fast HMR, ES modules support)
- **Express.js** - For backend API server
- **Concurrently** - To run both servers simultaneously

## Files to Create/Modify

### New Files
1. `package.json` - Project dependencies and scripts
2. `index.html` - HTML entry point
3. `main/main.jsx` - React app entry point
4. `main/App.jsx` - Root component wrapping MeetingAssistant
5. `server.js` - Express backend server
6. `vite.config.js` - Vite configuration with API proxy

### Updates to .gitignore
Add Node.js specific entries:
- `node_modules/`
- `dist/`
- `.env`

## Verification Steps

1. Run `npm install` to install dependencies
2. Run `npm run dev` to start both frontend and backend
3. Open browser to `http://localhost:5173`
4. Click the calendar button (📅) to open chat widget
5. Type a message to verify the UI works

**Note**: Full functionality (actual Zoom/Calendar API calls) requires valid API credentials configured in environment variables. For demo purposes, the UI interaction and Claude API communication can be tested.

## Environment Variables Required

From `envvars.env`:
- `ANTHROPIC_API_KEY` - Required for Claude API
- `ZOOM_*` - For Zoom meeting creation (optional for UI demo)
- `GOOGLE_*` - For Google Calendar (optional for UI demo)
