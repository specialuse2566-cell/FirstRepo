import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';

export default function Register() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'CANDIDATE', companyName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authAPI.register(form);
      navigate('/login');
    } catch (err) {
      setError('Registration failed. Try again!');
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.logo}>Smart<span style={styles.accent}>Hire</span></h1>
        <h2 style={styles.title}>Create account</h2>
        <p style={styles.sub}>Join SmartHire today</p>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>First name</label>
              <input style={styles.input} name="firstName" placeholder="John" onChange={handleChange} required />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Last name</label>
              <input style={styles.input} name="lastName" placeholder="Doe" onChange={handleChange} required />
            </div>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input style={styles.input} name="email" type="email" placeholder="you@example.com" onChange={handleChange} required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input style={styles.input} name="password" type="password" placeholder="••••••••" onChange={handleChange} required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>I am a</label>
            <select style={styles.input} name="role" onChange={handleChange}>
              <option value="CANDIDATE">Candidate</option>
              <option value="RECRUITER">Recruiter</option>
            </select>
          </div>
          {form.role === 'RECRUITER' && (
            <div style={styles.field}>
              <label style={styles.label}>Company name</label>
              <input style={styles.input} name="companyName" placeholder="TechCorp" onChange={handleChange} />
            </div>
          )}
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <p style={styles.switch}>
          Already have an account? <Link to="/login" style={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0efeb' },
  card: { background: '#fff', padding: '48px', borderRadius: '16px', width: '100%', maxWidth: '480px', border: '1px solid #e2e1dd' },
  logo: { fontFamily: 'Georgia, serif', fontSize: '28px', marginBottom: '24px', color: '#1a1a1a' },
  accent: { color: '#2563eb' },
  title: { fontSize: '24px', fontWeight: '600', marginBottom: '8px' },
  sub: { color: '#6b6b6b', marginBottom: '28px', fontSize: '14px' },
  error: { background: '#fef2f2', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  field: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' },
  input: { width: '100%', padding: '11px 14px', border: '1.5px solid #e2e1dd', borderRadius: '9px', fontSize: '14px' },
  btn: { width: '100%', padding: '13px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: '9px', fontSize: '15px', fontWeight: '500', marginTop: '8px' },
  switch: { textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#6b6b6b' },
  link: { color: '#2563eb' },
};