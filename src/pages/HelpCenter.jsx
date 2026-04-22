import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Layout/Sidebar';
import Header from '../components/Layout/Header';

const ChatIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const EmailIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const PhoneIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.28a16 16 0 0 0 6.26 6.26l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

// ─── Email Modal ──────────────────────────────────────────────────────────────
const EmailModal = ({ onClose }) => {
  const [form, setForm] = useState({ subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const send = () => {
    if (!form.subject || !form.message) return;
    setSent(true);
    setTimeout(onClose, 2000);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
    }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '480px', margin: '16px', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0 }}>Send an Email</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#6B7280' }}>×</button>
        </div>
        {sent ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
            <p style={{ color: '#059669', fontWeight: '600' }}>Email sent! We'll get back to you in 2–4 hours.</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Subject</label>
              <input
                value={form.subject}
                onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                placeholder="What do you need help with?"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Message</label>
              <textarea
                value={form.message}
                onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                placeholder="Describe your issue in detail..."
                rows={5}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', resize: 'vertical' }}
              />
            </div>
            <button onClick={send} style={{
              width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
              background: '#2563EB', color: '#fff', fontSize: '15px', fontWeight: '600', cursor: 'pointer',
            }}>Send an Email</button>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const HelpCenter = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    try { return JSON.parse(localStorage.getItem('userPrefs') || '{}').darkMode ?? false; }
    catch { return false; }
  });
  const dm = darkMode;
  const navigate = useNavigate();

  const cards = [
    {
      icon: <ChatIcon />,
      title: 'In-App Live Chat',
      badge: { label: 'ONLINE', color: '#059669', bg: '#D1FAE5' },
      description: 'Best for technical issues and quick questions during exams',
      stats: [
        { label: 'AVG WAIT', value: 'UNDER 2 MINS' },
        { label: 'HOURS', value: '24/7 AVAILABLE' },
      ],
      btnLabel: 'Start Chatting',
      onClick: () => navigate('/Student/ContactSupport'),
    },
    {
      icon: <EmailIcon />,
      title: 'Email Support',
      description: 'Best for account billing, data exports, or non-urgent inquiries.',
      stats: [
        { label: 'AVG WAIT', value: '2–4 hours' },
        { label: 'HOURS', value: 'Mon–Fri, 8am–6pm' },
      ],
      btnLabel: 'Send an Email',
      onClick: () => setShowEmail(true),
    },
    {
      icon: <PhoneIcon />,
      title: 'Phone Support',
      description: 'Best for enterprise admins and complex integration setups.',
      stats: [
        { label: 'AVG WAIT', value: 'Instant Connection' },
        { label: 'HOURS', value: 'Mon–Fri, 10am–4pm' },
      ],
      btnLabel: 'Request a call',
      onClick: () => window.open('tel:+1-800-000-0000'),
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: dm ? '#111827' : '#F9FAFB', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Header onMenuToggle={() => setSidebarOpen(true)} title="Settings" darkMode={darkMode} />

      <div className="flex pt-16">
        <Sidebar isOpen={sidebarOpen} userRole="student" onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 lg:ml-64" style={{ padding: '32px 16px' }}>
          <div style={{ maxWidth: '680px', margin: '0 auto' }}>

            {/* Back */}
            <button
              onClick={() => navigate(-1)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#6B7280', fontSize: '14px', marginBottom: '32px', padding: 0,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Back
            </button>

            {/* Title */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: '700', color: dm ? '#F9FAFB' : '#111827', margin: '0 0 8px' }}>
                How would you like to connect?
              </h1>
              <p style={{ fontSize: '14px', color: dm ? '#9CA3AF' : '#6B7280', margin: 0 }}>
                Our team is standing by to help you with your assessments, account settings, or technical troubleshooting.
              </p>
            </div>

            {/* Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {cards.map((card, i) => (
                <div key={i} style={{
                  background: dm ? '#1F2937' : '#fff', border: `1px solid ${dm ? '#374151' : '#E5E7EB'}`, borderRadius: '16px', padding: '28px',
                }}>
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '12px', background: '#EFF6FF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px',
                  }}>
                    {card.icon}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: '700', color: dm ? '#F9FAFB' : '#111827', margin: 0 }}>{card.title}</h2>
                    {card.badge && (
                      <span style={{
                        fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px',
                        background: card.badge.bg, color: card.badge.color, letterSpacing: '0.5px',
                      }}>{card.badge.label}</span>
                    )}
                  </div>

                  <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 20px', lineHeight: 1.6 }}>
                    {card.description}
                  </p>

                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr',
                    borderTop: `1px solid ${dm ? '#374151' : '#F3F4F6'}`, borderBottom: `1px solid ${dm ? '#374151' : '#F3F4F6'}`,
                    padding: '14px 0', marginBottom: '20px',
                  }}>
                    {card.stats.map((s, j) => (
                      <div key={j}>
                        <div style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: '600', letterSpacing: '0.8px', marginBottom: '4px' }}>
                          {s.label}
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: dm ? '#F9FAFB' : '#111827' }}>{s.value}</div>
                      </div>
                    ))}
                  </div>

                  <button onClick={card.onClick} style={{
                    width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
                    background: '#2563EB', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                  }}>
                    {card.btnLabel}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showEmail && <EmailModal onClose={() => setShowEmail(false)} />}
    </div>
  );
};

export default HelpCenter;
