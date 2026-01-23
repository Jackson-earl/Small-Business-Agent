import React from 'react';
import MeetingAssistant from './MeetingAssistant.jsx';

function App() {
  return (
    <div style={{ minHeight: '100vh', padding: '40px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ color: '#333', marginBottom: '8px' }}>Meeting Assistant Demo</h1>
        <p style={{ color: '#666', marginBottom: '24px' }}>
          Click the calendar button in the bottom-right corner to open the chat interface.
        </p>
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#333', fontSize: '18px', marginTop: 0 }}>How it works</h2>
          <ul style={{ color: '#555', lineHeight: '1.8' }}>
            <li>Type a message like "Schedule a team meeting tomorrow at 2 PM"</li>
            <li>The AI assistant will create a Zoom meeting</li>
            <li>It will also add the event to your Google Calendar</li>
          </ul>
        </div>
      </div>
      <MeetingAssistant />
    </div>
  );
}

export default App;
