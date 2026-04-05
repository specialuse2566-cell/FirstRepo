import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authAPI.login({ email, password });
      const token = res.data;
      const payload = JSON.parse(atob(token.split('.')[1]));
      login(email, payload.role, token);
      if (payload.role === 'CANDIDATE') navigate('/candidate');
      else navigate('/recruiter');
    } catch (err) {
      setError('Invalid email or password!');
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.logo}>Smart<span style={styles.accent}>Hire</span></h1>
        <h2 style={styles.title}>Welcome back</h2>
        <p style={styles.sub}>Sign in to your account</p>
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
            <input
              style={styles.input}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p style={styles.switch}>
          Don't have an account? <Link to="/register" style={styles.link}>Register</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0efeb' },
  card: { background: '#fff', padding: '48px', borderRadius: '16px', width: '100%', maxWidth: '420px', border: '1px solid #e2e1dd' },
  logo: { fontFamily: 'Georgia, serif', fontSize: '28px', marginBottom: '24px', color: '#1a1a1a' },
  accent: { color: '#2563eb' },
  title: { fontSize: '24px', fontWeight: '600', marginBottom: '8px' },
  sub: { color: '#6b6b6b', marginBottom: '28px', fontSize: '14px' },
  error: { background: '#fef2f2', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  field: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' },
  input: { width: '100%', padding: '11px 14px', border: '1.5px solid #e2e1dd', borderRadius: '9px', fontSize: '14px' },
  btn: { width: '100%', padding: '13px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: '9px', fontSize: '15px', fontWeight: '500', marginTop: '8px' },
  switch: { textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#6b6b6b' },
  link: { color: '#2563eb' },
};