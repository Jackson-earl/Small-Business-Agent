// Frontend, Button + Chat UI

import React, { useState, useEffect, useRef } from 'react';
import Anthropic from '@anthropic-ai/sdk';

// This is the button + chat interface your users will interact with
function MeetingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Draggable state
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;

      const deltaX = dragStart.current.x - e.clientX;
      const deltaY = dragStart.current.y - e.clientY;

      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        hasDragged.current = true;
      }

      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 60, dragStart.current.posX + deltaX)),
        y: Math.max(0, Math.min(window.innerHeight - 60, dragStart.current.posY + deltaY))
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    hasDragged.current = false;
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y
    };
    setIsDragging(true);
  };

  const handleClick = () => {
    if (!hasDragged.current) {
      setIsOpen(true);
    }
  };

  // Handle sending a message to the AI agent
  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message to chat
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Call your backend API that talks to Claude
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input,
          conversationHistory: messages 
        })
      });

      const data = await response.json();
      
      // Add agent response to chat
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.response 
      }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, something went wrong. Please try again.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* The Button - This is what users click */}
      {!isOpen && (
        <button
          onMouseDown={handleMouseDown}
          onClick={handleClick}
          style={{
            position: 'fixed',
            bottom: `${position.y}px`,
            right: `${position.x}px`,
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            fontSize: '24px',
            cursor: isDragging ? 'grabbing' : 'grab',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            userSelect: 'none'
          }}
        >
          📅
        </button>
      )}

      {/* The Chat Interface - Opens when button is clicked */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: `${position.y}px`,
          right: `${position.x}px`,
          width: '400px',
          height: '600px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000
        }}>
          {/* Header */}
          <div style={{
            padding: '16px',
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#007bff',
            color: 'white',
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px'
          }}>
            <h3 style={{ margin: 0 }}>Meeting Assistant</h3>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '20px',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {messages.length === 0 && (
              <div style={{
                textAlign: 'center',
                color: '#666',
                marginTop: '40px'
              }}>
                <p>👋 Hi! I can help you schedule meetings.</p>
                <p style={{ fontSize: '14px', marginTop: '8px' }}>
                  Try saying: "Schedule a team meeting tomorrow at 2 PM"
                </p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  padding: '12px',
                  borderRadius: '12px',
                  backgroundColor: msg.role === 'user' ? '#007bff' : '#f0f0f0',
                  color: msg.role === 'user' ? 'white' : 'black'
                }}
              >
                {msg.content}
              </div>
            ))}

            {loading && (
              <div style={{
                alignSelf: 'flex-start',
                padding: '12px',
                borderRadius: '12px',
                backgroundColor: '#f0f0f0'
              }}>
                <span>Thinking...</span>
              </div>
            )}
          </div>

          {/* Input Box */}
          <div style={{
            padding: '16px',
            borderTop: '1px solid #e0e0e0',
            display: 'flex',
            gap: '8px'
          }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your request..."
              style={{
                flex: 1,
                padding: '12px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                outline: 'none'
              }}
              disabled={loading}
            />
            <button
              onClick={handleSendMessage}
              disabled={loading || !input.trim()}
              style={{
                padding: '12px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                opacity: loading || !input.trim() ? 0.5 : 1
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MeetingAssistant;
