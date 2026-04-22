import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoPersonOutline } from 'react-icons/io5';
import Sidebar from '../components/Layout/Sidebar';
import Header from '../components/Layout/Header';
import { apiClient, API_ENDPOINTS } from '../config/api';

const EditProfile = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode] = useState(() => {
    try { return JSON.parse(localStorage.getItem('userPrefs') || '{}').darkMode ?? false; }
    catch { return false; }
  });
  const dm = darkMode;

  const [userId, setUserId] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'success' | 'updating'

  const [draft, setDraft] = useState({
    firstName: '', lastName: '', phone: '', email: '',
    institution: '', purposeOfUse: '', department: '', avatar: '',
  });

  const purposeOptions = [
     'Student',
    'Employee', 'Professional Candidate', ,
  ];

  // ── Fetch on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const meData = await apiClient.get(API_ENDPOINTS.ME);
        const me = meData.user || meData.data || meData;
        const id = me._id || me.id;
        if (!id) throw new Error('Could not determine user ID.');
        setUserId(id);

        const profileData = await apiClient.get(`/api/users/${id}`);
        const u = profileData.data || profileData.user || profileData;
        const mapped = {
          firstName:    u.firstName    || '',
          lastName:     u.lastName     || '',
          phone:        u.phone        || '',
          email:        u.email        || '',
          institution:  u.institution  || u.university || '',
          purposeOfUse: u.purposeOfUse || '',
          department:   u.department   || '',
          avatar:       u.avatar       || '',
        };
        setDraft(mapped);
        setAvatarPreview(mapped.avatar);
      } catch (err) {
        setPageError(err.message || 'Failed to load profile.');
      } finally {
        setPageLoading(false);
      }
    };
    load();
  }, []);

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    setError('');
    try {
      await apiClient.put(`/api/users/${userId}`, {
        firstName:    draft.firstName,
        lastName:     draft.lastName,
        phone:        draft.phone,
        university:   draft.institution,
        institution:  draft.institution,
        purposeOfUse: draft.purposeOfUse,
        department:   draft.department,
      });

      setStatus('success');
      setTimeout(() => {
        setStatus('updating');
        setTimeout(() => navigate('/student/settings'), 1800);
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
      setSaving(false);
    }
  };

  // ── Styles ──────────────────────────────────────────────────────────────────
  const fieldStyle = {
    width: '100%', padding: '10px 12px 10px 36px',
    border: `1px solid ${dm ? '#374151' : '#E5E7EB'}`,
    borderRadius: '8px', fontSize: '14px',
    color: dm ? '#F9FAFB' : '#111827',
    background: dm ? '#1F2937' : '#fff',
    boxSizing: 'border-box', outline: 'none',
  };
  const wrapStyle = { position: 'relative' };
  const iconStyle = {
    position: 'absolute', left: '12px', top: '50%',
    transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none',
  };
  const labelStyle = {
    display: 'block', fontSize: '12px',
    color: dm ? '#9CA3AF' : '#6B7280', marginBottom: '6px',
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: dm ? '#111827' : '#fff', fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '20px' }}>
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <p style={{ fontSize: '18px', fontWeight: '600', color: dm ? '#F9FAFB' : '#111827' }}>
            Profile updated successfully
          </p>
        </div>
      </div>
    );
  }

  // ── Loader screen ───────────────────────────────────────────────────────────
  if (status === 'updating') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: dm ? '#111827' : '#fff', fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <style>{`
          @keyframes bounce {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-14px); }
          }
        `}</style>
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '28px' }}>
            {[0, 1].map(i => (
              <div key={i} style={{
                width: '18px', height: '18px', borderRadius: '50%', background: '#2563EB',
                animation: `bounce 0.9s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: dm ? '#F9FAFB' : '#111827', marginBottom: '8px' }}>
            Updating Changes
          </h2>
          <p style={{ fontSize: '14px', color: dm ? '#9CA3AF' : '#6B7280' }}>Please wait</p>
        </div>
      </div>
    );
  }

  // ── Main page ───────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: dm ? '#111827' : '#F9FAFB', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <Header onMenuToggle={() => setSidebarOpen(true)} title="Settings" darkMode={darkMode} />

      <div className="flex pt-16">
        <Sidebar isOpen={sidebarOpen} userRole="student" onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 lg:ml-64" style={{ padding: '32px 16px' }}>
          <div style={{ maxWidth: '700px', margin: '0 auto' }}>

            {/* Back */}
            <button onClick={() => navigate(-1)} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: dm ? '#9CA3AF' : '#6B7280', fontSize: '14px',
              marginBottom: '32px', padding: 0,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Back
            </button>

            {/* Page loading */}
            {pageLoading && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: dm ? '#9CA3AF' : '#6B7280', fontSize: '14px' }}>
                Loading your profile...
              </div>
            )}

            {/* Page error */}
            {!pageLoading && pageError && (
              <div style={{
                background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px',
                padding: '12px 16px', color: '#991B1B', fontSize: '14px',
              }}>
                {pageError} — <button onClick={() => window.location.reload()} style={{ color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer' }}>Retry</button>
              </div>
            )}

            {!pageLoading && !pageError && (
              <>
                {/* Title */}
                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                  <h1 style={{ fontSize: '24px', fontWeight: '700', color: dm ? '#F9FAFB' : '#111827', margin: '0 0 6px' }}>
                    User Profile
                  </h1>
                  <p style={{ fontSize: '13px', color: dm ? '#9CA3AF' : '#6B7280', margin: 0 }}>
                    View and manage user details
                  </p>
                </div>

                {/* Avatar */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '36px' }}>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <div style={{
                      width: '90px', height: '90px', borderRadius: '50%',
                      background: '#DBEAFE', border: '3px solid #93C5FD',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '32px', fontWeight: '600', color: '#2563EB', overflow: 'hidden',
                    }}>
                      {avatarPreview
                        ? <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : (draft.firstName || draft.lastName)
                          ? `${draft.firstName?.[0] ?? ''}${draft.lastName?.[0] ?? ''}`
                          : <IoPersonOutline size={40} color="#2563EB" />
                      }
                    </div>
                    <label style={{
                      position: 'absolute', bottom: 0, right: 0,
                      width: '26px', height: '26px', borderRadius: '50%',
                      background: '#2563EB', border: '2px solid #fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    }}>
                      <input type="file" accept="image/*" style={{ display: 'none' }}
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          setAvatarPreview(URL.createObjectURL(file));
                          setAvatarLoading(true);
                          try {
                            const formData = new FormData();
                            formData.append('avatar', file);
                            const token = localStorage.getItem('authToken');
                            const res = await fetch(
                              `${import.meta.env.VITE_API_URL || 'https://cadna-backend-kpgj.onrender.com'}/api/users/${userId}/avatar`,
                              { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData }
                            );
                            const data = await res.json();
                            if (!data.success) throw new Error(data.message);
                            const newUrl = data.data?.avatar || '';
                            setAvatarPreview(newUrl);
                            setDraft(p => ({ ...p, avatar: newUrl }));
                          } catch (err) {
                            setError(err.message || 'Failed to upload image.');
                            setAvatarPreview(draft.avatar || '');
                          } finally {
                            setAvatarLoading(false);
                          }
                        }}
                      />
                      {avatarLoading
                        ? <span style={{ width: '10px', height: '10px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                        : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      }
                    </label>
                  </div>
                </div>

                {error && (
                  <div style={{
                    background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px',
                    padding: '10px 14px', marginBottom: '20px', color: '#991B1B', fontSize: '13px',
                  }}>{error}</div>
                )}

                {/* User Information */}
                <h3 style={{ fontSize: '15px', fontWeight: '600', color: dm ? '#F9FAFB' : '#111827', margin: '0 0 16px' }}>
                  User Information
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '28px' }}>
                  {[
                    { label: 'First Name',    name: 'firstName', icon: 'person' },
                    { label: 'Last Name',     name: 'lastName',  icon: 'person' },
                    { label: 'Phone Number',  name: 'phone',     icon: 'phone', type: 'tel' },
                    { label: 'Email Address', name: 'email',     icon: 'email', readOnly: true },
                  ].map(f => (
                    <div key={f.name}>
                      <label style={labelStyle}>{f.label}</label>
                      <div style={wrapStyle}>
                        <span style={iconStyle}>
                          {f.icon === 'person' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>}
                          {f.icon === 'phone'  && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.28a16 16 0 0 0 6.26 6.26l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>}
                          {f.icon === 'email'  && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}
                        </span>
                        <input
                          type={f.type || 'text'}
                          value={draft[f.name] || ''}
                          readOnly={f.readOnly}
                          onChange={e => !f.readOnly && setDraft(p => ({ ...p, [f.name]: e.target.value }))}
                          placeholder={f.label}
                          style={{ ...fieldStyle, ...(f.readOnly ? { opacity: 0.6, cursor: 'not-allowed' } : {}) }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Academic/Professional Details */}
                <h3 style={{ fontSize: '15px', fontWeight: '600', color: dm ? '#F9FAFB' : '#111827', margin: '0 0 16px' }}>
                  Academic/Professional details
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={labelStyle}>Select Purpose</label>
                    <div style={wrapStyle}>
                      <span style={iconStyle}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                      </span>
                      <select
                        value={draft.purposeOfUse || ''}
                        onChange={e => setDraft(p => ({ ...p, purposeOfUse: e.target.value }))}
                        style={{ ...fieldStyle, appearance: 'none', cursor: 'pointer' }}
                      >
                        <option value="">Select Purpose</option>
                        {purposeOptions.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                      <span style={{ ...iconStyle, left: 'auto', right: '12px' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                      </span>
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Institution</label>
                    <div style={wrapStyle}>
                      <span style={iconStyle}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                      </span>
                      <input
                        type="text"
                        value={draft.institution || ''}
                        onChange={e => setDraft(p => ({ ...p, institution: e.target.value }))}
                        placeholder="Enter Institution"
                        style={fieldStyle}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '36px' }}>
                  <label style={labelStyle}>Department</label>
                  <div style={wrapStyle}>
                    <span style={iconStyle}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
                    </span>
                    <input
                      type="text"
                      value={draft.department || ''}
                      onChange={e => setDraft(p => ({ ...p, department: e.target.value }))}
                      placeholder="Enter Department"
                      style={fieldStyle}
                    />
                  </div>
                </div>

                <button onClick={handleSave} disabled={saving} style={{
                  width: '100%', padding: '14px', borderRadius: '10px', border: 'none',
                  background: saving ? '#93C5FD' : '#2563EB', color: '#fff',
                  fontSize: '15px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer',
                  marginBottom: '40px',
                }}>
                  {saving ? 'Updating...' : 'Update Profile'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
