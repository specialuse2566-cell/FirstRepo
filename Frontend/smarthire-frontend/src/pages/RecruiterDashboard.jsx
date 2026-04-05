import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { jobsAPI, applicationAPI } from '../services/api';

export default function RecruiterDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('jobs');
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', company: '', location: '',
    jobType: 'FULL_TIME', experienceLevel: 'MID',
    skills: '', salary: '', postedBy: ''
  });

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const res = await jobsAPI.getAllJobs();
      setJobs(res.data.filter(j => j.postedBy === user.email));
    } catch (err) {}
  };

  const loadApplications = async (jobId) => {
    try {
      const res = await applicationAPI.getApplicationsByJob(jobId);
      setApplications(res.data);
      setActiveTab('applications');
    } catch (err) {}
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      await jobsAPI.createJob({
        ...form,
        skills: form.skills.split(',').map(s => s.trim()),
        postedBy: user.email,
      });
      setMsg('Job posted successfully!');
      setForm({ title: '', description: '', company: '', location: '', jobType: 'FULL_TIME', experienceLevel: 'MID', skills: '', salary: '', postedBy: '' });
      loadJobs();
      setActiveTab('jobs');
    } catch (err) {
      setMsg('Error posting job!');
    }
    setTimeout(() => setMsg(''), 3000);
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await applicationAPI.updateStatus(id, status);
      setMsg(`Status updated to ${status}!`);
      setApplications(applications.map(a => a.id === id ? { ...a, status } : a));
    } catch (err) {}
    setTimeout(() => setMsg(''), 3000);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div style={styles.container}>
      <nav style={styles.nav}>
        <h1 style={styles.logo}>Smart<span style={styles.accent}>Hire</span></h1>
        <div style={styles.navCenter}>
          {['jobs', 'post', 'applications'].map(tab => (
            <button key={tab} style={activeTab === tab ? styles.tabActive : styles.tab}
              onClick={() => setActiveTab(tab)}>
              {tab === 'post' ? 'Post a Job' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        <div style={styles.navRight}>
          <span style={styles.userEmail}>{user?.email}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      {msg && <div style={styles.msg}>{msg}</div>}

      <div style={styles.content}>
        {activeTab === 'jobs' && (
          <div>
            <h2 style={styles.pageTitle}>My Job Postings</h2>
            {jobs.length === 0 ? (
              <p style={styles.empty}>No jobs posted yet. Post your first job!</p>
            ) : (
              <div style={styles.list}>
                {jobs.map(job => (
                  <div key={job.id} style={styles.jobCard}>
                    <div>
                      <h3 style={styles.jobTitle}>{job.title}</h3>
                      <p style={styles.jobSub}>{job.company} · {job.location} · {job.salary}</p>
                      <div style={styles.skills}>
                        {job.skills?.map((s, i) => <span key={i} style={styles.skill}>{s}</span>)}
                      </div>
                    </div>
                    <div style={styles.jobActions}>
                      <button style={styles.btnPrimary} onClick={() => loadApplications(job.id)}>
                        View Applications
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'post' && (
          <div style={styles.formContainer}>
            <h2 style={styles.pageTitle}>Post a New Job</h2>
            <form onSubmit={handleCreateJob} style={styles.form}>
              <div style={styles.row}>
                <div style={styles.field}>
                  <label style={styles.label}>Job title</label>
                  <input style={styles.input} name="title" placeholder="e.g. Java Backend Developer" value={form.title} onChange={handleChange} required />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Company</label>
                  <input style={styles.input} name="company" placeholder="e.g. TechCorp India" value={form.company} onChange={handleChange} required />
                </div>
              </div>
              <div style={styles.row}>
                <div style={styles.field}>
                  <label style={styles.label}>Location</label>
                  <input style={styles.input} name="location" placeholder="e.g. Pune" value={form.location} onChange={handleChange} required />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Salary</label>
                  <input style={styles.input} name="salary" placeholder="e.g. 8-12 LPA" value={form.salary} onChange={handleChange} required />
                </div>
              </div>
              <div style={styles.row}>
                <div style={styles.field}>
                  <label style={styles.label}>Job type</label>
                  <select style={styles.input} name="jobType" value={form.jobType} onChange={handleChange}>
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="REMOTE">Remote</option>
                  </select>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Experience level</label>
                  <select style={styles.input} name="experienceLevel" value={form.experienceLevel} onChange={handleChange}>
                    <option value="JUNIOR">Junior</option>
                    <option value="MID">Mid</option>
                    <option value="SENIOR">Senior</option>
                  </select>
                </div>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Skills (comma separated)</label>
                <input style={styles.input} name="skills" placeholder="e.g. Java, Spring Boot, MongoDB" value={form.skills} onChange={handleChange} required />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Job description</label>
                <textarea style={{ ...styles.input, height: '120px', resize: 'vertical' }} name="description" placeholder="Describe the role and responsibilities..." value={form.description} onChange={handleChange} required />
              </div>
              <button style={styles.btnSubmit} type="submit">Post Job</button>
            </form>
          </div>
        )}

        {activeTab === 'applications' && (
          <div>
            <h2 style={styles.pageTitle}>Applications</h2>
            {applications.length === 0 ? (
              <p style={styles.empty}>No applications yet for this job.</p>
            ) : (
              <div style={styles.list}>
                {applications.map(app => (
                  <div key={app.id} style={styles.appCard}>
                    <div>
                      <h3 style={styles.jobTitle}>{app.candidateEmail}</h3>
                      <p style={styles.jobSub}>Applied: {new Date(app.appliedAt).toLocaleDateString()}</p>
                      <p style={styles.coverLetter}>{app.coverLetter}</p>
                    </div>
                    <div style={styles.appActions}>
                      <span style={{ ...styles.status, background: app.status === 'SHORTLISTED' ? '#dcfce7' : app.status === 'REJECTED' ? '#fef2f2' : '#eff4ff', color: app.status === 'SHORTLISTED' ? '#16a34a' : app.status === 'REJECTED' ? '#dc2626' : '#2563eb' }}>
                        {app.status}
                      </span>
                      <button style={styles.btnSuccess} onClick={() => handleUpdateStatus(app.id, 'SHORTLISTED')}>Shortlist</button>
                      <button style={styles.btnDanger} onClick={() => handleUpdateStatus(app.id, 'REJECTED')}>Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', background: '#f0efeb' },
  nav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 40px', background: '#fff', borderBottom: '1px solid #e2e1dd', position: 'sticky', top: 0, zIndex: 100 },
  logo: { fontFamily: 'Georgia, serif', fontSize: '20px', color: '#1a1a1a' },
  accent: { color: '#2563eb' },
  navCenter: { display: 'flex', gap: '4px' },
  tab: { padding: '8px 16px', border: 'none', background: 'transparent', fontSize: '14px', color: '#6b6b6b', borderRadius: '8px' },
  tabActive: { padding: '8px 16px', border: 'none', background: '#eff4ff', fontSize: '14px', color: '#2563eb', borderRadius: '8px', fontWeight: '500' },
  navRight: { display: 'flex', alignItems: 'center', gap: '12px' },
  userEmail: { fontSize: '13px', color: '#6b6b6b' },
  logoutBtn: { padding: '8px 16px', border: '1px solid #e2e1dd', borderRadius: '8px', background: 'transparent', fontSize: '13px' },
  msg: { background: '#dcfce7', color: '#16a34a', padding: '12px 40px', fontSize: '14px' },
  content: { padding: '40px' },
  pageTitle: { fontFamily: 'Georgia, serif', fontSize: '36px', color: '#1a1a1a', marginBottom: '24px', letterSpacing: '-1px' },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  jobCard: { background: '#fff', border: '1px solid #e2e1dd', borderRadius: '12px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  jobTitle: { fontSize: '16px', fontWeight: '600', color: '#1a1a1a', marginBottom: '4px' },
  jobSub: { fontSize: '13px', color: '#6b6b6b', marginBottom: '8px' },
  skills: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  skill: { padding: '3px 10px', background: '#f0efeb', borderRadius: '100px', fontSize: '12px' },
  jobActions: { display: 'flex', gap: '8px' },
  btnPrimary: { padding: '8px 16px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500' },
  formContainer: { maxWidth: '700px' },
  form: { background: '#fff', border: '1px solid #e2e1dd', borderRadius: '16px', padding: '32px' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  field: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' },
  input: { width: '100%', padding: '11px 14px', border: '1.5px solid #e2e1dd', borderRadius: '9px', fontSize: '14px', background: '#fff' },
  btnSubmit: { width: '100%', padding: '13px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: '9px', fontSize: '15px', fontWeight: '500', marginTop: '8px' },
  appCard: { background: '#fff', border: '1px solid #e2e1dd', borderRadius: '12px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' },
  coverLetter: { fontSize: '13px', color: '#6b6b6b', marginTop: '8px', maxWidth: '500px' },
  appActions: { display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' },
  status: { padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: '500' },
  btnSuccess: { padding: '8px 16px', background: '#dcfce7', color: '#16a34a', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500' },
  btnDanger: { padding: '8px 16px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500' },
  empty: { color: '#6b6b6b', fontSize: '15px' },
};