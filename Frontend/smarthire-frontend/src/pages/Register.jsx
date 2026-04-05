import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';

const passwordChecks = [
  { label: 'At least 8 characters', test: (value) => value.length >= 8 },
  { label: 'Includes a letter', test: (value) => /[A-Za-z]/.test(value) },
  { label: 'Includes a number', test: (value) => /\d/.test(value) },
];

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

    if (form.password.length < 8) {
      setError('Use a password with at least 8 characters.');
      setLoading(false);
      return;
    }

    if (form.role === 'RECRUITER' && !form.companyName.trim()) {
      setError('Recruiters should add a company name before continuing.');
      setLoading(false);
      return;
    }

    try {
      await authAPI.register({
        ...form,
        email: form.email.trim(),
        companyName: form.companyName.trim(),
      });
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      setError(typeof err.response?.data === 'string' ? err.response.data : 'Registration failed. Try again!');
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.shell}>
        <section style={styles.leftPanel}>
          <div>
            <h1 style={styles.logo}>Smart<span style={styles.accent}>Hire</span></h1>
            <p style={styles.brandTag}>Build a profile once, then manage jobs, interviews, applications, documents, and hiring updates from one workspace.</p>
          </div>

          <div style={styles.rolePanel}>
            <p style={styles.eyebrow}>Choose your role</p>
            <div style={styles.roleCards}>
              <button
                type="button"
                style={form.role === 'CANDIDATE' ? styles.roleCardActive : styles.roleCard}
                onClick={() => setForm((current) => ({ ...current, role: 'CANDIDATE', companyName: '' }))}
              >
                <span style={styles.roleTitle}>Candidate</span>
                <span style={styles.roleDesc}>Apply to jobs, upload files, take mock tests, and track offers.</span>
              </button>
              <button
                type="button"
                style={form.role === 'RECRUITER' ? styles.roleCardActive : styles.roleCard}
                onClick={() => setForm((current) => ({ ...current, role: 'RECRUITER' }))}
              >
                <span style={styles.roleTitle}>Recruiter</span>
                <span style={styles.roleDesc}>Post roles, review candidate resumes, schedule interviews, and track hires.</span>
              </button>
            </div>
          </div>
        </section>

        <section style={styles.rightPanel}>
          <div style={styles.card}>
            <h2 style={styles.title}>Create your account</h2>
            <p style={styles.sub}>Set up your SmartHire workspace in a few quick steps.</p>
            {error && <div style={styles.error}>{error}</div>}

            <form onSubmit={handleSubmit}>
              <div style={styles.row}>
                <div style={styles.field}>
                  <label style={styles.label}>First name</label>
                  <input style={styles.input} name="firstName" placeholder="John" value={form.firstName} onChange={handleChange} required />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Last name</label>
                  <input style={styles.input} name="lastName" placeholder="Doe" value={form.lastName} onChange={handleChange} required />
                </div>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Email</label>
                <input style={styles.input} name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Password</label>
                <input style={styles.input} name="password" type="password" placeholder="Use at least 8 characters" value={form.password} onChange={handleChange} required />
                <div style={styles.passwordChecks}>
                  {passwordChecks.map((check) => (
                    <span key={check.label} style={check.test(form.password) ? styles.checkPassed : styles.checkPending}>
                      {check.label}
                    </span>
                  ))}
                </div>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Account type</label>
                <select style={styles.input} name="role" value={form.role} onChange={handleChange}>
                  <option value="CANDIDATE">Candidate</option>
                  <option value="RECRUITER">Recruiter</option>
                </select>
              </div>
              {form.role === 'RECRUITER' && (
                <div style={styles.field}>
                  <label style={styles.label}>Company name</label>
                  <input style={styles.input} name="companyName" placeholder="TechCorp" value={form.companyName} onChange={handleChange} required />
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
        </section>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', background: 'linear-gradient(135deg, #f7f4ed 0%, #ebe8df 100%)', padding: '32px' },
  shell: { maxWidth: '1180px', margin: '0 auto', minHeight: 'calc(100vh - 64px)', display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'rgba(255,255,255,0.7)', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.7)', overflow: 'hidden', boxShadow: '0 28px 56px rgba(15, 23, 42, 0.12)' },
  leftPanel: { padding: '48px', background: 'linear-gradient(160deg, #111827 0%, #1e293b 45%, #0f766e 100%)', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  rightPanel: { padding: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logo: { fontFamily: 'Georgia, serif', fontSize: '30px', color: '#fff', marginBottom: '10px' },
  accent: { color: '#2dd4bf' },
  brandTag: { fontSize: '14px', lineHeight: '1.7', color: 'rgba(255,255,255,0.74)', maxWidth: '430px' },
  rolePanel: { marginTop: '48px' },
  eyebrow: { fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.62)', marginBottom: '16px' },
  roleCards: { display: 'grid', gap: '14px' },
  roleCard: { textAlign: 'left', padding: '18px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff' },
  roleCardActive: { textAlign: 'left', padding: '18px', borderRadius: '18px', border: '1px solid rgba(45,212,191,0.3)', background: 'linear-gradient(135deg, rgba(13,148,136,0.32) 0%, rgba(20,184,166,0.12) 100%)', color: '#fff' },
  roleTitle: { display: 'block', fontSize: '17px', fontWeight: '700', marginBottom: '8px' },
  roleDesc: { display: 'block', fontSize: '13px', lineHeight: '1.7', color: 'rgba(255,255,255,0.8)' },
  card: { width: '100%', maxWidth: '460px' },
  title: { fontFamily: 'Georgia, serif', fontSize: '34px', color: '#111827', marginBottom: '10px' },
  sub: { color: '#6b7280', marginBottom: '24px', fontSize: '14px', lineHeight: '1.7' },
  error: { background: '#fef2f2', color: '#dc2626', padding: '13px 14px', borderRadius: '12px', border: '1px solid #fecaca', marginBottom: '16px', fontSize: '14px' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  field: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#374151' },
  input: { width: '100%', padding: '13px 14px', border: '1.5px solid #d6d3d1', borderRadius: '12px', fontSize: '14px', background: '#fff' },
  passwordChecks: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' },
  checkPassed: { padding: '6px 10px', borderRadius: '999px', background: '#dcfce7', color: '#166534', fontSize: '11px', fontWeight: '700' },
  checkPending: { padding: '6px 10px', borderRadius: '999px', background: '#f3f4f6', color: '#6b7280', fontSize: '11px', fontWeight: '700' },
  btn: { width: '100%', padding: '14px', background: '#111827', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', marginTop: '8px' },
  switch: { textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#6b6b6b' },
  link: { color: '#2563eb', fontWeight: '700' },
};
