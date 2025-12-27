'use client';

import { useState } from 'react';

export default function TestPage() {
  const [output, setOutput] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [promptInput, setPromptInput] = useState('Porsche 911 driving on Pacific Coast Highway at golden hour');

  // Your brand IDs from the database
  const brands = [
    { id: '87d84033-aa63-46ea-b0d1-e29f9dbd3b2c', name: 'Porsche' },
    { id: 'e247e2c8-b90d-45b0-943b-b98b40c56bdd', name: 'Nike' },
  ];

  const log = (label: string, data: any) => {
    const entry = `\n=== ${label} ===\n${JSON.stringify(data, null, 2)}`;
    setOutput(prev => entry + '\n' + prev);
  };

  const checkCredits = async () => {
    try {
      const res = await fetch('/api/credits');
      const data = await res.json();
      log('Credits', data);
    } catch (err: any) {
      log('Credits Error', { error: err.message });
    }
  };

  const createSession = async (brandId: string, brandName: string) => {
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId }),
      });
      const data = await res.json();
      log(`Create Session (${brandName})`, data);
      if (data.session?.sessionId) {
        setSessionId(data.session.sessionId);
      }
    } catch (err: any) {
      log('Session Error', { error: err.message });
    }
  };

  const getActiveSession = async () => {
    try {
      const res = await fetch('/api/sessions');
      const data = await res.json();
      log('Active Session', data);
      if (data.session?.sessionId) {
        setSessionId(data.session.sessionId);
      }
    } catch (err: any) {
      log('Session Error', { error: err.message });
    }
  };

  const closeSession = async () => {
    try {
      const res = await fetch('/api/sessions', { method: 'DELETE' });
      const data = await res.json();
      log('Close Session', data);
      setSessionId('');
    } catch (err: any) {
      log('Close Error', { error: err.message });
    }
  };

  const generatePrompt = async () => {
    log('Generate Starting', { sessionId, promptInput });
    
    if (!sessionId) {
      log('Error', { error: 'No session. Create a session first.' });
      return;
    }
    
    try {
      log('Sending request...', { sessionId, userInput: promptInput });
      
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput: promptInput,
          platform: 'veo3',
          outputType: 'video',
          sessionId,
        }),
      });
      
      log('Response status', { status: res.status, ok: res.ok });
      
      const text = await res.text();
      log('Raw response', text);
      
      try {
        const data = JSON.parse(text);
        log('Generate Prompt', data);
      } catch {
        log('Parse error', { raw: text });
      }
    } catch (err: any) {
      log('Generate Error', { error: err.message, stack: err.stack });
    }
  };

  const submitFeedback = async (promptId: string, rating: string) => {
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptId, rating }),
      });
      const data = await res.json();
      log(`Feedback (${rating})`, data);
    } catch (err: any) {
      log('Feedback Error', { error: err.message });
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Continuum Week 2 - API Test Page</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Controls */}
        <div>
          <h2>1. Credits</h2>
          <button onClick={checkCredits} style={btnStyle}>Check Balance</button>

          <h2>2. Sessions</h2>
          <div style={{ marginBottom: '10px' }}>
            {brands.map(b => (
              <button 
                key={b.id} 
                onClick={() => createSession(b.id, b.name)}
                style={btnStyle}
              >
                Start {b.name} Session
              </button>
            ))}
          </div>
          <button onClick={getActiveSession} style={btnStyle}>Get Active Session</button>
          <button onClick={closeSession} style={{...btnStyle, background: '#ff6666'}}>Close Session</button>
          
          {sessionId && (
            <div style={{ marginTop: '10px', padding: '10px', background: '#e0ffe0' }}>
              Active Session: <code>{sessionId}</code>
            </div>
          )}

          <h2>3. Generate Prompt</h2>
          <textarea
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            style={{ width: '100%', height: '80px', marginBottom: '10px' }}
            placeholder="Describe your shot..."
          />
          <button 
            onClick={generatePrompt} 
            style={{...btnStyle, background: sessionId ? '#00cc66' : '#cccccc'}}
          >
            Generate (costs credits)
          </button>

          <h2>4. Feedback</h2>
          <p style={{ fontSize: '12px' }}>Copy a promptId from output, then click:</p>
          <input 
            type="text" 
            id="promptIdInput" 
            placeholder="Paste promptId here"
            style={{ width: '100%', marginBottom: '10px', padding: '5px' }}
          />
          <div>
            <button onClick={() => {
              const pid = (document.getElementById('promptIdInput') as HTMLInputElement).value;
              if (pid) submitFeedback(pid, 'great');
            }} style={{...btnStyle, background: '#00cc66'}}>👍 Great</button>
            <button onClick={() => {
              const pid = (document.getElementById('promptIdInput') as HTMLInputElement).value;
              if (pid) submitFeedback(pid, 'good');
            }} style={{...btnStyle, background: '#ffcc00'}}>👌 Good</button>
            <button onClick={() => {
              const pid = (document.getElementById('promptIdInput') as HTMLInputElement).value;
              if (pid) submitFeedback(pid, 'bad');
            }} style={{...btnStyle, background: '#ff6666'}}>👎 Bad</button>
          </div>
        </div>

        {/* Output */}
        <div>
          <h2>Output Log</h2>
          <button onClick={() => setOutput('')} style={{...btnStyle, background: '#666'}}>Clear</button>
          <pre style={{ 
            background: '#1a1a1a', 
            color: '#00ff00', 
            padding: '15px', 
            height: '600px', 
            overflow: 'auto',
            fontSize: '12px',
            whiteSpace: 'pre-wrap'
          }}>
            {output || 'Click buttons to test endpoints...'}
          </pre>
        </div>
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: '10px 15px',
  margin: '5px',
  cursor: 'pointer',
  background: '#0066cc',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  fontSize: '14px',
};
