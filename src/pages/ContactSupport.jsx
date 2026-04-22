import { useState, useRef, useEffect } from 'react';
import { apiClient } from '../config/api';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Layout/Sidebar';
import Header from '../components/Layout/Header';

const formatTime = () => {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const ContactSupport = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode] = useState(() => {
    try { return JSON.parse(localStorage.getItem('userPrefs') || '{}').darkMode ?? false; }
    catch { return false; }
  });
  const dm = darkMode;
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      from: 'agent',
      text: "Welcome to Assessacad Support!\nI'll be helping you today. How can I assist you?",
      time: '10:30 AM',
    },
  ]);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const [thinking, setThinking] = useState(false);

  const send = async () => {
    if (!input.trim() || thinking) return;
    const userMsg = { from: 'user', text: input.trim(), time: formatTime() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setThinking(true);

    try {
      const history = newMessages.slice(-10); // send last 10 messages for context
      const data = await apiClient.post('/api/ai/support-chat', {
        message: userMsg.text,
        history,
      });
      setMessages(p => [...p, {
        from: 'agent',
        text: data.reply || "Sorry, I couldn't process that. Please try again.",
        time: formatTime(),
      }]);
    } catch (err) {
      setMessages(p => [...p, {
        from: 'agent',
        text: "Sorry, I'm having trouble connecting. Please email support@assessacad.com for help.",
        time: formatTime(),
      }]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: dm ? '#111827' : '#F9FAFB', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Header onMenuToggle={() => setSidebarOpen(true)} title="Support" darkMode={darkMode} />

      <div className="flex pt-16">
        <Sidebar isOpen={sidebarOpen} userRole="student" onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 lg:ml-64" style={{ padding: '24px 16px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: '560px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)' }}>

            {/* Chat Window */}
            <div style={{
              background: dm ? '#1F2937' : '#fff', borderRadius: '16px', border: `1px solid ${dm ? '#374151' : '#E5E7EB'}`,
              display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden',
            }}>

              {/* Header */}
              <div style={{
                padding: '16px 20px', borderBottom: `1px solid ${dm ? '#374151' : '#F3F4F6'}`,
                display: 'flex', alignItems: 'center', gap: '12px',
              }}>
                <button
                  onClick={() => navigate(-1)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#6B7280', display: 'flex' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                </button>

                {/* Avatar */}
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%', background: '#2563EB',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: '700', fontSize: '16px', flexShrink: 0,
                }}>A</div>

                <div>
                  <div style={{ fontWeight: '700', fontSize: '15px', color: dm ? '#F9FAFB' : '#111827' }}>Assessbot</div>
                  <div style={{ fontSize: '12px', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#059669', display: 'inline-block' }} />
                    Online
                  </div>
                </div>
              </div>

              {/* Info bar */}
              <div style={{
                background: '#EFF6FF', padding: '10px 20px',
                display: 'flex', alignItems: 'center', gap: '8px',
                borderBottom: '1px solid #DBEAFE',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span style={{ fontSize: '12px', color: '#2563EB' }}>Usually replies in a few minutes</span>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', background: dm ? '#1F2937' : '#fff' }}>
                {messages.map((m, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    flexDirection: m.from === 'user' ? 'row-reverse' : 'row',
                    alignItems: 'flex-end', gap: '8px',
                  }}>
                    {m.from === 'agent' && (
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%', background: '#2563EB',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: '12px', fontWeight: '700', flexShrink: 0,
                      }}>A</div>
                    )}
                    <div style={{ maxWidth: '75%' }}>
                      <div style={{
                        padding: '12px 16px',
                        borderRadius: m.from === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        background: m.from === 'user' ? '#2563EB' : (dm ? '#374151' : '#F3F4F6'),
                        color: m.from === 'user' ? '#fff' : (dm ? '#F9FAFB' : '#111827'),
                        fontSize: '14px', lineHeight: 1.5,
                        whiteSpace: 'pre-line',
                      }}>{m.text}</div>
                      <div style={{
                        fontSize: '11px', color: '#9CA3AF', marginTop: '4px',
                        textAlign: m.from === 'user' ? 'right' : 'left',
                      }}>{m.time}</div>
                    </div>
                  </div>
                ))}
                {thinking && (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%', background: '#2563EB',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: '12px', fontWeight: '700', flexShrink: 0,
                    }}>A</div>
                    <div style={{
                      padding: '12px 16px', borderRadius: '16px 16px 16px 4px',
                      background: '#F3F4F6', display: 'flex', gap: '4px', alignItems: 'center',
                    }}>
                      {[0, 1, 2].map(i => (
                        <span key={i} style={{
                          width: '7px', height: '7px', borderRadius: '50%', background: '#9CA3AF',
                          display: 'inline-block',
                          animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                        }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
              <style>{`
                @keyframes bounce {
                  0%, 60%, 100% { transform: translateY(0); }
                  30% { transform: translateY(-6px); }
                }
              `}</style>

              {/* Input */}
              <div style={{
                padding: '16px 20px', borderTop: `1px solid ${dm ? '#374151' : '#F3F4F6'}`,
                display: 'flex', gap: '10px', alignItems: 'center',
              }}>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && send()}
                  placeholder="How can we help..."
                  style={{
                    flex: 1, padding: '12px 16px',
                    border: `1px solid ${dm ? '#374151' : '#E5E7EB'}`, borderRadius: '24px',
                    fontSize: '14px', outline: 'none', background: dm ? '#374151' : '#F9FAFB', color: dm ? '#F9FAFB' : '#111827',
                  }}
                />
                <button onClick={send} disabled={thinking} style={{
                  width: '42px', height: '42px', borderRadius: '50%', border: 'none',
                  background: thinking ? '#93C5FD' : '#2563EB', cursor: thinking ? 'not-allowed' : 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactSupport;
