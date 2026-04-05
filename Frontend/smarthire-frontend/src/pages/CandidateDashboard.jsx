import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { jobsAPI, applicationAPI, interviewAPI } from '../services/api';

export default function CandidateDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('jobs');
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    loadJobs();
    loadApplications();
    loadInterviews();
  }, []);

  const loadJobs = async () => {
    try {
      const res = await jobsAPI.getAllJobs();
      setJobs(res.data);
    } catch (err) {}
  };

  const loadApplications = async () => {
    try {
      const res = await applicationAPI.getApplicationsByCandidate(user.email);
      setApplications(res.data);
    } catch (err) {}
  };

  const loadInterviews = async () => {
    try {
      const res = await interviewAPI.getInterviewsByCandidate(user.email);
      setInterviews(res.data);
    } catch (err) {}
  };

  const handleApply = async (job) => {
    setLoading(true);
    try {
      await applicationAPI.applyForJob({
        candidateEmail: user.email,
        jobId: job.id,
        coverLetter: `I am interested in the ${job.title} position at ${job.company}.`,
      });
      setMsg('Applied successfully!');
      loadApplications();
    } catch (err) {
      setMsg('Already applied or error occurred!');
    }
    setLoading(false);
    setTimeout(() => setMsg(''), 3000);
  };

  const handleScheduleInterview = async (job) => {
    setLoading(true);
    try {
      await interviewAPI.scheduleInterview({
        candidateEmail: user.email,
        jobId: job.id,
        jobTitle: job.title,
        interviewType: 'AI_MOCK',
      });
      setMsg('Interview scheduled!');
      loadInterviews();
      setActiveTab('interviews');
    } catch (err) {
      setMsg('Error scheduling interview!');
    }
    setLoading(false);
    setTimeout(() => setMsg(''), 3000);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const filteredJobs = jobs.filter(j =>
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.company.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={styles.container}>
      <nav style={styles.nav}>
        <h1 style={styles.logo}>Smart<span style={styles.accent}>Hire</span></h1>
        <div style={styles.navCenter}>
          {['jobs', 'applications', 'interviews'].map(tab => (
            <button key={tab} style={activeTab === tab ? styles.tabActive : styles.tab}
              onClick={() => setActiveTab(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
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
            <h2 style={styles.pageTitle}>Find your next role</h2>
            <input style={styles.search} placeholder="Search jobs..." value={search}
              onChange={(e) => setSearch(e.target.value)} />
            <div style={styles.jobsGrid}>
              {filteredJobs.map(job => (
                <div key={job.id} style={styles.jobCard}>
                  <div style={styles.jobHeader}>
                    <div>
                      <h3 style={styles.jobTitle}>{job.title}</h3>
                      <p style={styles.jobCompany}>{job.company} · {job.location}</p>
                    </div>
                    <span style={styles.jobType}>{job.jobType}</span>
                  </div>
                  <p style={styles.jobDesc}>{job.description}</p>
                  <div style={styles.skills}>
                    {job.skills?.map((s, i) => <span key={i} style={styles.skill}>{s}</span>)}
                  </div>
                  <div style={styles.jobFooter}>
                    <span style={styles.salary}>{job.salary}</span>
                    <div style={styles.jobActions}>
                      <button style={styles.btnSecondary} onClick={() => handleScheduleInterview(job)}>
                        Mock Interview
                      </button>
                      <button style={styles.btnPrimary} onClick={() => handleApply(job)}>
                        Apply Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'applications' && (
          <div>
            <h2 style={styles.pageTitle}>My Applications</h2>
            {applications.length === 0 ? (
              <p style={styles.empty}>No applications yet. Start applying!</p>
            ) : (
              <div style={styles.list}>
                {applications.map(app => (
                  <div key={app.id} style={styles.listCard}>
                    <div>
                      <h3 style={styles.listTitle}>{app.jobTitle}</h3>
                      <p style={styles.listSub}>{app.company}</p>
                      <p style={styles.listDate}>Applied: {new Date(app.appliedAt).toLocaleDateString()}</p>
                    </div>
                    <span style={{ ...styles.status, background: app.status === 'SHORTLISTED' ? '#dcfce7' : app.status === 'REJECTED' ? '#fef2f2' : '#eff4ff', color: app.status === 'SHORTLISTED' ? '#16a34a' : app.status === 'REJECTED' ? '#dc2626' : '#2563eb' }}>
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'interviews' && (
          <div>
            <h2 style={styles.pageTitle}>My Interviews</h2>
            {interviews.length === 0 ? (
              <p style={styles.empty}>No interviews scheduled yet.</p>
            ) : (
              <div style={styles.list}>
                {interviews.map(interview => (
                  <div key={interview.id} style={styles.listCard}>
                    <div>
                      <h3 style={styles.listTitle}>{interview.jobTitle}</h3>
                      <p style={styles.listSub}>{interview.interviewType}</p>
                      {interview.score > 0 && (
                        <p style={styles.score}>Score: {interview.score}/10 — {interview.feedback}</p>
                      )}
                    </div>
                    <span style={{ ...styles.status, background: interview.status === 'COMPLETED' ? '#dcfce7' : '#eff4ff', color: interview.status === 'COMPLETED' ? '#16a34a' : '#2563eb' }}>
                      {interview.status}
                    </span>
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
  search: { width: '100%', maxWidth: '400px', padding: '11px 16px', border: '1.5px solid #e2e1dd', borderRadius: '9px', fontSize: '14px', marginBottom: '24px', background: '#fff' },
  jobsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '16px' },
  jobCard: { background: '#fff', border: '1px solid #e2e1dd', borderRadius: '12px', padding: '24px' },
  jobHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' },
  jobTitle: { fontSize: '16px', fontWeight: '600', color: '#1a1a1a', marginBottom: '4px' },
  jobCompany: { fontSize: '13px', color: '#6b6b6b' },
  jobType: { padding: '4px 10px', background: '#eff4ff', color: '#2563eb', borderRadius: '100px', fontSize: '11px', fontWeight: '500' },
  jobDesc: { fontSize: '14px', color: '#6b6b6b', lineHeight: '1.6', marginBottom: '12px' },
  skills: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' },
  skill: { padding: '3px 10px', background: '#f0efeb', borderRadius: '100px', fontSize: '12px', color: '#1a1a1a' },
  jobFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e1dd', paddingTop: '16px' },
  salary: { fontSize: '14px', fontWeight: '500', color: '#1a1a1a' },
  jobActions: { display: 'flex', gap: '8px' },
  btnPrimary: { padding: '8px 16px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500' },
  btnSecondary: { padding: '8px 16px', background: 'transparent', color: '#1a1a1a', border: '1px solid #e2e1dd', borderRadius: '8px', fontSize: '13px' },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  listCard: { background: '#fff', border: '1px solid #e2e1dd', borderRadius: '12px', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  listTitle: { fontSize: '15px', fontWeight: '600', color: '#1a1a1a', marginBottom: '4px' },
  listSub: { fontSize: '13px', color: '#6b6b6b', marginBottom: '4px' },
  listDate: { fontSize: '12px', color: '#aaa' },
  status: { padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: '500' },
  score: { fontSize: '13px', color: '#16a34a', marginTop: '4px' },
  empty: { color: '#6b6b6b', fontSize: '15px' },
};