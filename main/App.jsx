import React, { useState, useEffect } from 'react';
import MeetingAssistant from './MeetingAssistant.jsx';

function App() {
  const [userId, setUserId] = useState(() => localStorage.getItem('userId') || '');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Check connection status when userId changes
  useEffect(() => {
    if (userId) {
      checkConnectionStatus();
    }
  }, [userId]);

  // Check URL for OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('connected') === 'true') {
      checkConnectionStatus();
      window.history.replaceState({}, document.title, '/');
    }
  }, []);

  const checkConnectionStatus = async () => {
    if (!userId) return;
    try {
      const response = await fetch(`/auth/google/status?userId=${userId}`);
      const data = await response.json();
      setIsConnected(data.connected);
    } catch (error) {
      console.error('Status check failed:', error);
    }
  };

  const handleEmailChange = (e) => {
    const email = e.target.value;
    setUserId(email);
    localStorage.setItem('userId', email);
  };

  const connectGoogle = async () => {
    if (!userId) {
      alert('Please enter your email first!');
      return;
    }
    setIsConnecting(true);
    try {
      const response = await fetch('/auth/google/url');
      const data = await response.json();
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Failed to get auth URL:', error);
      alert('Failed to connect. Please try again.');
      setIsConnecting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', padding: '40px', backgroundColor: '#f5f5f5' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ color: '#333', marginBottom: '8px' }}>Meeting Assistant Demo</h1>
        <p style={{ color: '#666', marginBottom: '24px' }}>
          Connect your Google Calendar, then click the calendar button to chat.
        </p>

        {/* Setup Card */}
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <h2 style={{ color: '#333', fontSize: '18px', marginTop: 0 }}>Setup</h2>

          {/* Email Input */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: 600 }}>
              Your Email:
            </label>
            <input
              type="email"
              value={userId}
              onChange={handleEmailChange}
              placeholder="your.email@company.com"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Connection Status */}
          <div style={{
            padding: '15px 20px',
            borderRadius: '12px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: isConnected ? '#d4edda' : '#fff3cd',
            border: `2px solid ${isConnected ? '#28a745' : '#ffc107'}`,
            color: isConnected ? '#155724' : '#856404'
          }}>
            <span>{isConnected ? '✅' : '⚠️'}</span>
            <span>{isConnected ? 'Google Calendar connected' : 'Google Calendar not connected'}</span>
          </div>

          {/* Connect Button */}
          {!isConnected && (
            <button
              onClick={connectGoogle}
              disabled={isConnecting || !userId}
              style={{
                backgroundColor: isConnecting || !userId ? '#ccc' : '#4285f4',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: isConnecting || !userId ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {isConnecting ? 'Connecting...' : 'Connect Google Calendar'}
            </button>
          )}
        </div>

        {/* How it works */}
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#333', fontSize: '18px', marginTop: 0 }}>How it works</h2>
          <ul style={{ color: '#555', lineHeight: '1.8' }}>
            <li>Enter your email and connect Google Calendar</li>
            <li>Click the calendar button in the corner to open the chat</li>
            <li>Say something like "Schedule a team meeting tomorrow at 2 PM"</li>
            <li>The AI creates a Zoom meeting and adds it to your calendar</li>
          </ul>
        </div>
      </div>

      <MeetingAssistant userId={userId} isConnected={isConnected} />
    </div>
  );
}

export default App;
