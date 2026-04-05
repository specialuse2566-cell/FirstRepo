import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const trustPoints = [
  'Role-based dashboards for recruiters and candidates',
  'Timed mock tests with practice links and attempt history',
  'Resume, CV, interview, and hiring workflow in one place',
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Enter both email and password to continue.');
      setLoading(false);
      return;
    }

    try {
      const res = await authAPI.login({ email: email.trim(), password });
      const token = res.data;
      const payload = JSON.parse(atob(token.split('.')[1]));
      login(email.trim(), payload.role, token);
      if (payload.role === 'CANDIDATE') navigate('/candidate');
      else navigate('/recruiter');
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.shell}>
        <section style={styles.leftPanel}>
          <div style={styles.brandWrap}>
            <h1 style={styles.logo}>Smart<span style={styles.accent}>Hire</span></h1>
            <p style={styles.brandTag}>Professional hiring, mock tests, and interview coordination in one focused workspace.</p>
          </div>

          <div style={styles.heroBlock}>
            <p style={styles.eyebrow}>Candidate and recruiter workspace</p>
            <h2 style={styles.heroTitle}>Return to the pipeline with everything already organized.</h2>
            <p style={styles.heroSub}>Pick up your applications, interviews, mock tests, and hiring actions without losing context.</p>
          </div>

          <div style={styles.trustList}>
            {trustPoints.map((point) => (
              <div key={point} style={styles.trustItem}>
                <span style={styles.trustDot} />
                <span style={styles.trustText}>{point}</span>
              </div>
            ))}
          </div>
        </section>

        <section style={styles.rightPanel}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.title}>Welcome back</h2>
              <p style={styles.sub}>Sign in to continue your SmartHire workspace.</p>
            </div>

            {location.state?.registered && (
              <div style={styles.success}>Account created successfully. Sign in to continue.</div>
            )}

            {location.state?.message && (
              <div style={styles.info}>{location.state.message}</div>
            )}

            {error && <div style={styles.error}>{error}</div>}

            <form onSubmit={handleSubmit}>
              <div style={styles.field}>
                <label style={styles.label}>Email</label>
                <input
                  style={styles.input}
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Password</label>
                <div style={styles.passwordWrap}>
                  <input
                    style={styles.inputPassword}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button style={styles.toggleBtn} type="button" onClick={() => setShowPassword((current) => !current)}>
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <button style={styles.btn} type="submit" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <div style={styles.metaCard}>
              <span style={styles.metaLabel}>Good to know</span>
              <p style={styles.metaText}>Use the same account to access your dashboard, profile, mock tests, interview schedule, and hiring updates.</p>
            </div>

            <p style={styles.switch}>
              Don't have an account? <Link to="/register" style={styles.link}>Create one</Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', background: 'linear-gradient(135deg, #f7f4ed 0%, #ebe8df 100%)', padding: '32px' },
  shell: { maxWidth: '1180px', margin: '0 auto', minHeight: 'calc(100vh - 64px)', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', background: 'rgba(255,255,255,0.68)', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.7)', overflow: 'hidden', boxShadow: '0 28px 56px rgba(15, 23, 42, 0.12)' },
  leftPanel: { padding: '48px', background: 'linear-gradient(160deg, #111827 0%, #1e293b 45%, #2563eb 100%)', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  rightPanel: { padding: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  brandWrap: { marginBottom: '48px' },
  logo: { fontFamily: 'Georgia, serif', fontSize: '30px', color: '#fff', marginBottom: '10px' },
  accent: { color: '#60a5fa' },
  brandTag: { fontSize: '14px', lineHeight: '1.7', color: 'rgba(255,255,255,0.74)', maxWidth: '420px' },
  heroBlock: { maxWidth: '520px' },
  eyebrow: { fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.62)', marginBottom: '16px' },
  heroTitle: { fontFamily: 'Georgia, serif', fontSize: '48px', lineHeight: '1.08', letterSpacing: '-1.5px', marginBottom: '18px' },
  heroSub: { fontSize: '16px', lineHeight: '1.8', color: 'rgba(255,255,255,0.8)' },
  trustList: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '40px' },
  trustItem: { display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px', borderRadius: '16px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)' },
  trustDot: { width: '10px', height: '10px', borderRadius: '999px', background: '#60a5fa', marginTop: '7px', flexShrink: 0 },
  trustText: { fontSize: '13px', lineHeight: '1.7', color: 'rgba(255,255,255,0.86)' },
  card: { width: '100%', maxWidth: '420px' },
  cardHeader: { marginBottom: '22px' },
  title: { fontFamily: 'Georgia, serif', fontSize: '34px', color: '#111827', marginBottom: '10px' },
  sub: { color: '#6b7280', fontSize: '14px', lineHeight: '1.7' },
  success: { background: '#dcfce7', color: '#166534', padding: '13px 14px', borderRadius: '12px', border: '1px solid #bbf7d0', marginBottom: '16px', fontSize: '14px' },
  info: { background: '#dbeafe', color: '#1d4ed8', padding: '13px 14px', borderRadius: '12px', border: '1px solid #bfdbfe', marginBottom: '16px', fontSize: '14px' },
  error: { background: '#fef2f2', color: '#dc2626', padding: '13px 14px', borderRadius: '12px', border: '1px solid #fecaca', marginBottom: '16px', fontSize: '14px' },
  field: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#374151' },
  input: { width: '100%', padding: '13px 14px', border: '1.5px solid #d6d3d1', borderRadius: '12px', fontSize: '14px', background: '#fff' },
  passwordWrap: { position: 'relative' },
  inputPassword: { width: '100%', padding: '13px 74px 13px 14px', border: '1.5px solid #d6d3d1', borderRadius: '12px', fontSize: '14px', background: '#fff' },
  toggleBtn: { position: 'absolute', right: '8px', top: '8px', padding: '7px 10px', borderRadius: '10px', border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: '12px', fontWeight: '700', color: '#374151' },
  btn: { width: '100%', padding: '14px', background: '#111827', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', marginTop: '8px' },
  metaCard: { marginTop: '18px', padding: '16px', background: '#f9fafb', border: '1px solid #ece8e1', borderRadius: '14px' },
  metaLabel: { display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#6b7280', marginBottom: '8px' },
  metaText: { fontSize: '13px', lineHeight: '1.7', color: '#4b5563' },
  switch: { textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#6b6b6b' },
  link: { color: '#2563eb', fontWeight: '700' },
};
