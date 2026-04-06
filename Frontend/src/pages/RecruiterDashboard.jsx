import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { jobsAPI, applicationAPI, interviewAPI, usersAPI } from '../services/api';

const emptyProfile = {
  firstName: '',
  lastName: '',
  email: '',
  role: '',
  companyName: '',
  phone: '',
  location: '',
  headline: '',
  bio: '',
  avatarImageData: '',
  skills: '',
  experienceYears: '',
};

const recruiterTabs = [
  { id: 'jobs', label: 'Jobs', hint: 'Review your active postings' },
  { id: 'post', label: 'Post a Job', hint: 'Create a new opportunity' },
  { id: 'applications', label: 'Hiring Pipeline', hint: 'Screen applicants and files' },
  { id: 'interviews', label: 'Interviews', hint: 'Schedule and confirm meetings' },
  { id: 'hired', label: 'History', hint: 'Review hired and rejected outcomes' },
  { id: 'profile', label: 'Profile', hint: 'Showcase recruiter identity' },
];

export default function RecruiterDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('jobs');
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [recruiterApplications, setRecruiterApplications] = useState([]);
  const [hiredCandidates, setHiredCandidates] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [profile, setProfile] = useState(emptyProfile);
  const [profileSaving, setProfileSaving] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [applicationSearch, setApplicationSearch] = useState('');
  const [applicationStatusFilter, setApplicationStatusFilter] = useState('ALL');
  const [interviewTypeFilter, setInterviewTypeFilter] = useState('ALL');
  const [form, setForm] = useState({
    title: '', description: '', company: '', location: '',
    jobType: 'FULL_TIME', experienceLevel: 'MID',
    skills: '', salary: '', postedBy: ''
  });
  const [interviewForm, setInterviewForm] = useState({
    applicationId: '',
    interviewType: 'TECHNICAL',
    scheduledFor: defaultInterviewTime(),
    durationMinutes: 45,
    notes: '',
  });
  const avatarInputRef = useRef(null);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    if (!user?.email) return;
    loadJobs();
    loadRecruiterApplications();
    loadHiredCandidates();
    loadInterviews();
    loadProfile();
  }, [user?.email]);

  useEffect(() => {
    if (!profileMenuOpen) return undefined;

    const handleOutside = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };

    window.addEventListener('mousedown', handleOutside);
    return () => window.removeEventListener('mousedown', handleOutside);
  }, [profileMenuOpen]);

  const showMessage = (text, type = 'success') => {
    const id = Date.now() + Math.random();
    setNotifications((current) => [...current, { id, text, type }].slice(-4));
    window.setTimeout(() => {
      setNotifications((current) => current.filter((item) => item.id !== id));
    }, 3600);
  };

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

  const loadRecruiterApplications = async () => {
    try {
      const res = await applicationAPI.getApplicationsByRecruiter(user.email);
      setRecruiterApplications(res.data);
      setApplications((current) => current.length ? current : res.data);
      setInterviewForm((current) => ({
        ...current,
        applicationId: current.applicationId || res.data?.[0]?.id || '',
      }));
    } catch (err) {}
  };

  const loadHiredCandidates = async () => {
    try {
      const res = await applicationAPI.getHiredApplicationsByRecruiter(user.email);
      setHiredCandidates(res.data);
    } catch (err) {}
  };

  const loadInterviews = async () => {
    try {
      const res = await interviewAPI.getInterviewsByRecruiter(user.email);
      setInterviews(res.data);
    } catch (err) {}
  };

  const loadProfile = async () => {
    try {
      const res = await usersAPI.getProfile(user.email);
      const data = res.data || {};
      setProfile({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || user.email,
        role: data.role || user.role,
        companyName: data.companyName || '',
        phone: data.phone || '',
        location: data.location || '',
        headline: data.headline || '',
        bio: data.bio || '',
        avatarImageData: data.avatarImageData || '',
        skills: Array.isArray(data.skills) ? data.skills.join(', ') : '',
        experienceYears: data.experienceYears ?? '',
      });
      setForm((current) => ({
        ...current,
        company: current.company || data.companyName || '',
      }));
    } catch (err) {}
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      await jobsAPI.createJob({
        ...form,
        company: form.company || profile.companyName,
        skills: form.skills.split(',').map((skill) => skill.trim()).filter(Boolean),
        postedBy: user.email,
      });
      showMessage('Job posted successfully!', 'success');
      setForm({
        title: '',
        description: '',
        company: profile.companyName || '',
        location: '',
        jobType: 'FULL_TIME',
        experienceLevel: 'MID',
        skills: '',
        salary: '',
        postedBy: ''
      });
      await loadJobs();
      setActiveTab('jobs');
    } catch (err) {
      if (err.response?.status === 401) {
        showMessage('Your session expired. Please log in again.', 'error');
      } else if (typeof err.response?.data === 'string' && err.response.data.trim()) {
        showMessage(err.response.data, 'error');
      } else {
        showMessage('Error posting job!', 'error');
      }
    }
  };

  const handleUpdateStatus = async (application, status) => {
    try {
      await applicationAPI.updateStatus(application.id, status);
      await loadRecruiterApplications();
      await loadApplications(application.jobId);
      await loadHiredCandidates();
      showMessage(`Status updated to ${status}!`, status === 'REJECTED' ? 'warning' : 'success');
    } catch (err) {
      showMessage('Error updating candidate status!', 'error');
    }
  };

  const handleInterviewFormChange = (e) => {
    setInterviewForm({ ...interviewForm, [e.target.name]: e.target.value });
  };

  const handleScheduleRecruiterInterview = async (e) => {
    e.preventDefault();
    const selectedApplication = recruiterApplications.find((application) => application.id === interviewForm.applicationId);
    if (!selectedApplication) {
      showMessage('Select an application first.', 'error');
      return;
    }

    try {
      await interviewAPI.scheduleInterview({
        candidateEmail: selectedApplication.candidateEmail,
        recruiterEmail: user.email,
        company: selectedApplication.company,
        jobId: selectedApplication.jobId,
        jobTitle: selectedApplication.jobTitle,
        interviewType: interviewForm.interviewType,
        roleFocus: selectedApplication.jobTitle,
        scheduledBy: 'RECRUITER',
        scheduledFor: interviewForm.scheduledFor,
        durationMinutes: Number(interviewForm.durationMinutes),
        videoEnabled: true,
        notes: interviewForm.notes,
      });
      await loadInterviews();
      showMessage('Interview scheduled successfully!', 'success');
    } catch (err) {
      showMessage('Error scheduling interview!', 'error');
    }
  };

  const handleRecruiterInterviewResponse = async (interviewId, accepted) => {
    try {
      await interviewAPI.respondToInterview(interviewId, {
        role: 'RECRUITER',
        accepted,
      });
      await loadInterviews();
      showMessage(accepted ? 'Interview confirmed on recruiter side.' : 'Interview declined.', accepted ? 'success' : 'warning');
    } catch (err) {
      showMessage('Error updating interview response!', 'error');
    }
  };

  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showMessage('Please select a valid image file.', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showMessage('Please upload an image smaller than 2 MB.', 'error');
      return;
    }

    const data = await readFileAsDataUrl(file);
    setProfile((current) => ({ ...current, avatarImageData: data }));
    showMessage('Profile image ready. Save profile to keep it.', 'info');
  };

  const clearAvatar = () => {
    setProfile((current) => ({ ...current, avatarImageData: '' }));
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
    showMessage('Profile image removed. Save profile to keep this change.', 'info');
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      await usersAPI.updateProfile(user.email, {
        firstName: profile.firstName,
        lastName: profile.lastName,
        companyName: profile.companyName,
        phone: profile.phone,
        location: profile.location,
        headline: profile.headline,
        bio: profile.bio,
        avatarImageData: profile.avatarImageData,
        skills: profile.skills
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean),
        experienceYears: profile.experienceYears === '' ? null : Number(profile.experienceYears),
      });
      setForm((current) => ({ ...current, company: profile.companyName }));
      await loadProfile();
      showMessage('Profile updated successfully!', 'success');
    } catch (err) {
      showMessage('Error updating profile!', 'error');
    }
    setProfileSaving(false);
  };

  const handleLogout = () => {
    setProfileMenuOpen(false);
    logout();
    navigate('/');
  };

  const handleSwitchAccount = () => {
    setProfileMenuOpen(false);
    logout();
    navigate('/login', { state: { message: 'You signed out. Log in with another account to continue.' } });
  };

  const profileName = [profile.firstName, profile.lastName].filter(Boolean).join(' ');
  const pendingConfirmations = interviews.filter((interview) => interview.status === 'PENDING_CONFIRMATION').length;
  const activeTabConfig = recruiterTabs.find((tab) => tab.id === activeTab) || recruiterTabs[0];
  const displayName = profileName || 'Recruiter';
  const avatarLabel = getInitials(displayName, user?.email);
  const filteredApplications = applications.filter((application) => {
    const matchesSearch =
      application.candidateEmail?.toLowerCase().includes(applicationSearch.toLowerCase()) ||
      application.candidateName?.toLowerCase().includes(applicationSearch.toLowerCase()) ||
      application.jobTitle?.toLowerCase().includes(applicationSearch.toLowerCase()) ||
      application.company?.toLowerCase().includes(applicationSearch.toLowerCase());
    const matchesStatus = applicationStatusFilter === 'ALL' || application.status === applicationStatusFilter;
    return matchesSearch && matchesStatus;
  });
  const liveInterviews = interviews
    .filter((interview) => interviewTypeFilter === 'ALL' || interview.interviewType === interviewTypeFilter)
    .filter((interview) => interview.interviewType !== 'AI_MOCK')
    .sort((a, b) => new Date(b.scheduledFor || b.scheduledAt || 0) - new Date(a.scheduledFor || a.scheduledAt || 0));
  const mockAttempts = interviews
    .filter((interview) => interview.interviewType === 'AI_MOCK')
    .sort((a, b) => new Date(b.completedAt || b.scheduledAt || 0) - new Date(a.completedAt || a.scheduledAt || 0));
  const rejectedCandidates = recruiterApplications.filter((application) => application.status === 'REJECTED');
  const decisionApplications = [...recruiterApplications]
    .filter((application) => application.status === 'HIRED' || application.status === 'REJECTED')
    .sort((a, b) => getApplicationSortTime(b) - getApplicationSortTime(a));

  return (
    <div style={styles.container}>
      <div style={styles.shell}>
        <aside style={styles.sidebar}>
          <div>
            <div style={styles.brandBlock}>
              <h1 style={styles.logo}>Smart<span style={styles.accent}>Hire</span></h1>
              <p style={styles.brandText}>Recruiter workspace for job posting, hiring pipeline reviews, interviews, and final hires.</p>
            </div>

            <div style={styles.sidebarGroup}>
              <p style={styles.sidebarHeading}>Workspace</p>
              <div style={styles.sidebarTabs}>
                {recruiterTabs.map((tab) => (
                  <button
                    key={tab.id}
                    style={activeTab === tab.id ? styles.sidebarTabActive : styles.sidebarTab}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <span style={styles.sidebarTabLabel}>{tab.label}</span>
                    <span style={styles.sidebarTabHint}>{tab.hint}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={styles.sidebarFooter}>
            <div style={styles.sidebarProfileCard}>
              <div style={styles.sidebarIdentityRow}>
                {profile.avatarImageData ? (
                  <img src={profile.avatarImageData} alt={displayName} style={styles.sidebarAvatarImage} />
                ) : (
                  <div style={styles.sidebarAvatarFallback}>{avatarLabel}</div>
                )}
                <div>
              <p style={styles.sidebarProfileLabel}>Signed in as</p>
              <h3 style={styles.sidebarProfileName}>{displayName}</h3>
              <p style={styles.sidebarProfileEmail}>{user?.email}</p>
                </div>
              </div>
            </div>
            <button style={styles.sidebarLogout} onClick={handleLogout}>Logout</button>
          </div>
        </aside>

        <div style={styles.workspace}>
          <div style={styles.toastStack}>
            {notifications.map((notification) => (
              <div key={notification.id} style={getToastStyle(notification.type)}>
                <div style={styles.toastDot} />
                <p style={styles.toastText}>{notification.text}</p>
              </div>
            ))}
          </div>

          <div style={styles.topbar}>
            <div>
              <p style={styles.topbarEyebrow}>Active section</p>
              <h2 style={styles.topbarTitle}>{activeTabConfig.label}</h2>
              <p style={styles.topbarText}>{activeTabConfig.hint}</p>
            </div>
            <div style={styles.topbarControls}>
              <label style={styles.selectLabel}>
                Quick switch
                <select style={styles.sectionSelect} value={activeTab} onChange={(e) => setActiveTab(e.target.value)}>
                  {recruiterTabs.map((tab) => (
                    <option key={tab.id} value={tab.id}>{tab.label}</option>
                  ))}
                </select>
              </label>
              <div style={styles.profileMenuShell} ref={profileMenuRef}>
                <button style={styles.profileTrigger} type="button" onClick={() => setProfileMenuOpen((current) => !current)}>
                  {profile.avatarImageData ? (
                    <img src={profile.avatarImageData} alt={displayName} style={styles.profileTriggerImage} />
                  ) : (
                    <div style={styles.profileTriggerFallback}>{avatarLabel}</div>
                  )}
                  <div style={styles.profileTriggerText}>
                    <span style={styles.profileTriggerName}>{displayName}</span>
                    <span style={styles.profileTriggerMeta}>{profile.role || 'RECRUITER'}</span>
                  </div>
                  <span style={styles.profileChevron}>{profileMenuOpen ? '▴' : '▾'}</span>
                </button>
                {profileMenuOpen && (
                  <div style={styles.profileDropdown}>
                    <div style={styles.profileDropdownHeader}>
                      {profile.avatarImageData ? (
                        <img src={profile.avatarImageData} alt={displayName} style={styles.dropdownAvatarImage} />
                      ) : (
                        <div style={styles.dropdownAvatarFallback}>{avatarLabel}</div>
                      )}
                      <div>
                        <strong style={styles.dropdownName}>{displayName}</strong>
                        <p style={styles.dropdownEmail}>{user?.email}</p>
                      </div>
                    </div>
                    <button style={styles.dropdownAction} type="button" onClick={() => { setActiveTab('profile'); setProfileMenuOpen(false); }}>
                      Open profile
                    </button>
                    <button style={styles.dropdownAction} type="button" onClick={() => { setActiveTab('interviews'); setProfileMenuOpen(false); }}>
                      View interviews
                    </button>
                    <button style={styles.dropdownAction} type="button" onClick={() => { setProfileMenuOpen(false); navigate('/'); }}>
                      Go to home
                    </button>
                    <button style={styles.dropdownAction} type="button" onClick={handleSwitchAccount}>
                      Switch account
                    </button>
                    <button style={styles.dropdownLogout} type="button" onClick={handleLogout}>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={styles.content}>
        <div style={styles.heroCard}>
          <div>
            <p style={styles.heroEyebrow}>Recruiter Workspace</p>
            <h2 style={styles.heroTitle}>{profile.companyName || profileName || 'Run a cleaner hiring pipeline'}</h2>
            <p style={styles.heroText}>
              Post jobs, review submitted resumes and CVs, schedule recruiter interviews, and track final hiring decisions from one organized dashboard.
            </p>
          </div>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <span style={styles.statLabel}>Job Posts</span>
              <strong style={styles.statValue}>{jobs.length}</strong>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statLabel}>Applications</span>
              <strong style={styles.statValue}>{recruiterApplications.length}</strong>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statLabel}>Pending Interviews</span>
              <strong style={styles.statValue}>{pendingConfirmations}</strong>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statLabel}>Hires</span>
              <strong style={styles.statValue}>{hiredCandidates.length}</strong>
            </div>
          </div>
        </div>

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
            <h2 style={styles.pageTitle}>Hiring Pipeline</h2>
            <p style={styles.profileSub}>Review candidate details, cover letters, and resume/CV uploads before you shortlist, hire, or reject.</p>
            <div style={styles.filterRow}>
              <input
                style={styles.searchInput}
                placeholder="Search by candidate, email, job title, or company"
                value={applicationSearch}
                onChange={(e) => setApplicationSearch(e.target.value)}
              />
              <select style={styles.filterSelect} value={applicationStatusFilter} onChange={(e) => setApplicationStatusFilter(e.target.value)}>
                <option value="ALL">All statuses</option>
                <option value="PENDING">Pending</option>
                <option value="SHORTLISTED">Shortlisted</option>
                <option value="HIRED">Hired</option>
                <option value="REJECTED">Rejected</option>
              </select>
              <span style={styles.countPill}>{applications.length} applications</span>
            </div>
            {applications.length === 0 ? (
              <p style={styles.empty}>No applications yet for this job.</p>
            ) : (
              <div style={styles.list}>
                {filteredApplications.map(app => (
                  <div key={app.id} style={styles.appCard}>
                    <div>
                      <h3 style={styles.jobTitle}>{app.candidateName || app.candidateEmail}</h3>
                      <p style={styles.jobSub}>{app.candidateEmail}</p>
                      {app.candidateHeadline && <p style={styles.coverLetter}>{app.candidateHeadline}</p>}
                      {app.candidatePhone && <p style={styles.coverLetter}>Phone: {app.candidatePhone}</p>}
                      <p style={styles.jobSub}>Applied: {new Date(app.appliedAt).toLocaleDateString()}</p>
                      <p style={styles.jobSub}>Latest update: {formatDateTime(app.statusUpdatedAt || app.appliedAt)}</p>
                      <p style={styles.coverLetter}>{app.coverLetter}</p>
                      <div style={styles.skills}>
                        {app.candidateSkills?.map((skill, index) => <span key={index} style={styles.skill}>{skill}</span>)}
                      </div>
                      <div style={styles.fileLinks}>
                        {app.resumeFileData && <a href={app.resumeFileData} download={app.resumeFileName || 'resume'} style={styles.inlineLink}>Download Resume</a>}
                        {app.cvFileData && <a href={app.cvFileData} download={app.cvFileName || 'cv'} style={styles.inlineLink}>Download CV</a>}
                      </div>
                      <details style={styles.timelineDetails}>
                        <summary style={styles.timelineSummary}>View application log</summary>
                        <div style={styles.timelineList}>
                          {getApplicationStatusHistory(app).map((entry, index) => (
                            <div key={`${app.id}-timeline-${index}`} style={styles.timelineItem}>
                              <span style={styles.timelineDot} />
                              <div style={styles.timelineBody}>
                                <div style={styles.timelineHeader}>
                                  <span style={statusStyle(entry.status)}>{entry.status}</span>
                                  <span style={styles.timelineTime}>{formatDateTime(entry.changedAt)}</span>
                                </div>
                                <p style={styles.timelineMessage}>{getStatusLogMessage(entry)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                    <div style={styles.appActions}>
                      <span style={statusStyle(app.status)}>{app.status}</span>
                      <button style={styles.btnInfo} onClick={() => handleUpdateStatus(app, 'SHORTLISTED')}>Shortlist</button>
                      <button style={styles.btnHire} onClick={() => handleUpdateStatus(app, 'HIRED')}>Hire</button>
                      <button style={styles.btnDanger} onClick={() => handleUpdateStatus(app, 'REJECTED')}>Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {applications.length > 0 && filteredApplications.length === 0 && (
              <p style={styles.empty}>No applications match the current search or status filter.</p>
            )}
          </div>
        )}

        {activeTab === 'interviews' && (
          <div>
            <h2 style={styles.pageTitle}>Interview Scheduling</h2>
            <p style={styles.profileSub}>Manage recruiter-led interviews and candidate-requested meetings in one organized section with shared video links.</p>
            <div style={styles.formContainer}>
              <form onSubmit={handleScheduleRecruiterInterview} style={styles.form}>
                <div style={styles.profileHero}>
                  <div>
                    <h3 style={styles.profileName}>Schedule Video Interview</h3>
                    <p style={styles.profileSub}>Choose an applicant, pick the round, and SmartHire will create a shared video-call link for both sides.</p>
                  </div>
                  <span style={styles.rolePill}>VIDEO READY</span>
                </div>
                <div style={styles.row}>
                  <div style={styles.field}>
                    <label style={styles.label}>Candidate</label>
                    <select style={styles.input} name="applicationId" value={interviewForm.applicationId} onChange={handleInterviewFormChange}>
                      {recruiterApplications.map((application) => (
                        <option key={application.id} value={application.id}>{application.candidateEmail} · {application.jobTitle}</option>
                      ))}
                    </select>
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Interview type</label>
                    <select style={styles.input} name="interviewType" value={interviewForm.interviewType} onChange={handleInterviewFormChange}>
                      <option value="TECHNICAL">Technical</option>
                      <option value="HR">HR</option>
                    </select>
                  </div>
                </div>
                <div style={styles.row}>
                  <div style={styles.field}>
                    <label style={styles.label}>Meeting time</label>
                    <input style={styles.input} type="datetime-local" name="scheduledFor" value={interviewForm.scheduledFor} onChange={handleInterviewFormChange} />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Duration (minutes)</label>
                    <input style={styles.input} type="number" min="15" step="15" name="durationMinutes" value={interviewForm.durationMinutes} onChange={handleInterviewFormChange} />
                  </div>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Notes</label>
                  <textarea style={styles.textarea} name="notes" value={interviewForm.notes} onChange={handleInterviewFormChange} placeholder="Agenda, prep requirements, or discussion topics." />
                </div>
                <button style={styles.btnSubmit} type="submit">Schedule Interview</button>
              </form>
            </div>

            <div style={styles.filterRow}>
              <select style={styles.filterSelect} value={interviewTypeFilter} onChange={(e) => setInterviewTypeFilter(e.target.value)}>
                <option value="ALL">All live interviews</option>
                <option value="TECHNICAL">Technical only</option>
                <option value="HR">HR only</option>
              </select>
              <span style={styles.countPill}>{liveInterviews.length} live interviews</span>
            </div>

            {liveInterviews.length === 0 ? (
              <p style={styles.empty}>No live interviews scheduled yet.</p>
            ) : (
              <div style={styles.list}>
                {liveInterviews.map((interview) => (
                  <div key={interview.id} style={styles.appCard}>
                    <div>
                      <h3 style={styles.jobTitle}>{interview.candidateEmail}</h3>
                      <p style={styles.jobSub}>{interview.jobTitle} · {interview.interviewType}</p>
                      <p style={styles.coverLetter}>Scheduled for: {formatDateTime(interview.scheduledFor || interview.scheduledAt)}</p>
                      {interview.videoMeetingLink && (
                        <a href={interview.videoMeetingLink} target="_blank" rel="noreferrer" style={styles.inlineLink}>Open video call</a>
                      )}
                      {interview.notes && <p style={styles.coverLetter}>{interview.notes}</p>}
                    </div>
                    <div style={styles.appActions}>
                      <span style={interview.status === 'CONFIRMED' || interview.status === 'COMPLETED' ? styles.hiredBadge : styles.statusPending}>
                        {interview.status}
                      </span>
                      {interview.status === 'PENDING_CONFIRMATION' && !interview.recruiterConfirmed && (
                        <>
                          <button style={styles.btnInfo} onClick={() => handleRecruiterInterviewResponse(interview.id, true)}>Confirm</button>
                          <button style={styles.btnDanger} onClick={() => handleRecruiterInterviewResponse(interview.id, false)}>Decline</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={styles.mockAttemptsSection}>
              <div style={styles.mockAttemptsHeader}>
                <div>
                  <h3 style={styles.profileName}>Candidate Mock-Test Attempts</h3>
                  <p style={styles.profileSub}>Every retake creates a separate attempt, so you can review all rounds completed by a candidate for your job posts.</p>
                </div>
                <span style={styles.rolePill}>{mockAttempts.length} attempts</span>
              </div>

              {mockAttempts.length === 0 ? (
                <p style={styles.empty}>No candidate mock-test attempts yet.</p>
              ) : (
                <div style={styles.list}>
                  {mockAttempts.map((attempt) => (
                    <div key={attempt.id} style={styles.mockAttemptCard}>
                      <div style={styles.mockAttemptHeader}>
                        <div>
                          <h3 style={styles.jobTitle}>{attempt.candidateEmail}</h3>
                          <p style={styles.jobSub}>{attempt.jobTitle} · {attempt.company || 'SmartHire'}</p>
                        </div>
                        <div style={styles.mockAttemptBadges}>
                          <span style={styles.statusInfo}>{attempt.status}</span>
                          {attempt.status === 'COMPLETED' ? (
                            <span style={styles.mockScoreBadge}>Score {attempt.score ?? 0}/10</span>
                          ) : (
                            <span style={styles.pendingAttemptBadge}>Awaiting submission</span>
                          )}
                        </div>
                      </div>

                      <div style={styles.mockAttemptMeta}>
                        <span style={styles.metaPill}>
                          {attempt.status === 'COMPLETED' ? 'Completed' : 'Created'}: {formatDateTime(attempt.completedAt || attempt.scheduledAt)}
                        </span>
                        <span style={styles.metaPill}>{attempt.questions?.length || 0} questions</span>
                        <span style={styles.metaPill}>{attempt.durationMinutes || 30} min</span>
                        <span style={styles.metaPill}>Answered {attempt.answeredCount || 0}/{attempt.questions?.length || 0}</span>
                      </div>

                      {attempt.feedback && (
                        <p style={styles.coverLetter}>{attempt.feedback}</p>
                      )}
                      {attempt.evaluationSummary && (
                        <p style={styles.evaluationSummary}>{attempt.evaluationSummary}</p>
                      )}
                      {!!attempt.strengths?.length && (
                        <div style={styles.evaluationBlock}>
                          <p style={styles.evaluationTitle}>Strengths</p>
                          <div style={styles.evaluationChipWrap}>
                            {attempt.strengths.map((item, itemIndex) => (
                              <span key={`${attempt.id}-strength-${itemIndex}`} style={styles.positiveChip}>{item}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {!!attempt.improvementAreas?.length && (
                        <div style={styles.evaluationBlock}>
                          <p style={styles.evaluationTitle}>Improvement Areas</p>
                          <div style={styles.evaluationChipWrap}>
                            {attempt.improvementAreas.map((item, itemIndex) => (
                              <span key={`${attempt.id}-improvement-${itemIndex}`} style={styles.warningChip}>{item}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      <details style={styles.answersDetails}>
                        <summary style={styles.answersSummary}>Review submitted answers</summary>
                        <div style={styles.answerReviewList}>
                          {(attempt.questions || []).map((question, index) => (
                            <div key={`${attempt.id}-${index}`} style={styles.answerReviewCard}>
                              <p style={styles.answerQuestion}>Q{index + 1}. {question}</p>
                              <p style={styles.answerText}>{attempt.answers?.[index] || 'No answer submitted.'}</p>
                              {attempt.questionLinks?.[index] && (
                                <a href={attempt.questionLinks[index]} target="_blank" rel="noreferrer" style={styles.inlineLink}>Open related LeetCode practice</a>
                              )}
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'hired' && (
          <div>
            <h2 style={styles.pageTitle}>Hiring Decision History</h2>
            <p style={styles.profileSub}>Review every final decision across your job posts, including hires and rejections, with a complete application log for each candidate.</p>
            <div style={styles.historyStatsGrid}>
              <div style={styles.historySummaryCard}>
                <span style={styles.historySummaryLabel}>Hired</span>
                <strong style={styles.historySummaryValue}>{hiredCandidates.length}</strong>
              </div>
              <div style={styles.historySummaryCard}>
                <span style={styles.historySummaryLabel}>Rejected</span>
                <strong style={styles.historySummaryValue}>{rejectedCandidates.length}</strong>
              </div>
              <div style={styles.historySummaryCard}>
                <span style={styles.historySummaryLabel}>Final Decisions</span>
                <strong style={styles.historySummaryValue}>{decisionApplications.length}</strong>
              </div>
            </div>
            {decisionApplications.length === 0 ? (
              <p style={styles.empty}>No hired or rejected decisions yet.</p>
            ) : (
              <div style={styles.list}>
                {decisionApplications.map((candidate) => (
                  <div key={candidate.id} style={candidate.status === 'HIRED' ? styles.historyCardPositive : styles.historyCardNegative}>
                    <div>
                      <div style={styles.historyCardHeader}>
                        <div>
                          <h3 style={styles.jobTitle}>{candidate.candidateName || candidate.candidateEmail}</h3>
                          <p style={styles.jobSub}>{candidate.jobTitle} · {candidate.company}</p>
                        </div>
                        <span style={statusStyle(candidate.status)}>{candidate.status}</span>
                      </div>
                      <p style={styles.coverLetter}>{candidate.candidateEmail}</p>
                      <p style={styles.jobSub}>Latest update: {formatDateTime(candidate.statusUpdatedAt || candidate.appliedAt)}</p>
                      <details style={styles.timelineDetails}>
                        <summary style={styles.timelineSummary}>Open complete log</summary>
                        <div style={styles.timelineList}>
                          {getApplicationStatusHistory(candidate).map((entry, index) => (
                            <div key={`${candidate.id}-history-${index}`} style={styles.timelineItem}>
                              <span style={styles.timelineDot} />
                              <div style={styles.timelineBody}>
                                <div style={styles.timelineHeader}>
                                  <span style={statusStyle(entry.status)}>{entry.status}</span>
                                  <span style={styles.timelineTime}>{formatDateTime(entry.changedAt)}</span>
                                </div>
                                <p style={styles.timelineMessage}>{getStatusLogMessage(entry)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div style={styles.formContainer}>
            <h2 style={styles.pageTitle}>Recruiter Profile</h2>
            <form onSubmit={handleProfileSave} style={styles.form}>
              <div style={styles.profileHero}>
                <div>
                  <h3 style={styles.profileName}>{displayName || user?.email}</h3>
                  <p style={styles.profileSub}>{profile.headline || 'Introduce yourself and your hiring brand.'}</p>
                </div>
                <span style={styles.rolePill}>{profile.role || 'RECRUITER'}</span>
              </div>
              <div style={styles.profileMediaCard}>
                <div style={styles.profileMediaRow}>
                  {profile.avatarImageData ? (
                    <img src={profile.avatarImageData} alt={displayName} style={styles.profileAvatarLargeImage} />
                  ) : (
                    <div style={styles.profileAvatarLargeFallback}>{avatarLabel}</div>
                  )}
                  <div style={styles.profileMediaText}>
                    <h4 style={styles.mediaTitle}>Profile image</h4>
                    <p style={styles.mediaSub}>Give your recruiter profile a clean photo or brand image so candidates recognize your hiring identity quickly.</p>
                  </div>
                </div>
                <div style={styles.profileMediaActions}>
                  <input ref={avatarInputRef} style={styles.hiddenInput} type="file" accept="image/*" onChange={handleAvatarUpload} />
                  <button style={styles.btnPrimary} type="button" onClick={() => avatarInputRef.current?.click()}>Upload image</button>
                  {profile.avatarImageData && <button style={styles.btnInfo} type="button" onClick={clearAvatar}>Remove image</button>}
                </div>
              </div>
              <div style={styles.row}>
                <div style={styles.field}>
                  <label style={styles.label}>First name</label>
                  <input style={styles.input} name="firstName" value={profile.firstName} onChange={handleProfileChange} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Last name</label>
                  <input style={styles.input} name="lastName" value={profile.lastName} onChange={handleProfileChange} />
                </div>
              </div>
              <div style={styles.row}>
                <div style={styles.field}>
                  <label style={styles.label}>Email</label>
                  <input style={styles.inputDisabled} value={profile.email} disabled />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Company</label>
                  <input style={styles.input} name="companyName" value={profile.companyName} onChange={handleProfileChange} />
                </div>
              </div>
              <div style={styles.row}>
                <div style={styles.field}>
                  <label style={styles.label}>Phone</label>
                  <input style={styles.input} name="phone" value={profile.phone} onChange={handleProfileChange} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Location</label>
                  <input style={styles.input} name="location" value={profile.location} onChange={handleProfileChange} />
                </div>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Headline</label>
                <input style={styles.input} name="headline" value={profile.headline} onChange={handleProfileChange} placeholder="e.g. Hiring backend engineers for cloud-native products" />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Team skills focus</label>
                <input style={styles.input} name="skills" value={profile.skills} onChange={handleProfileChange} placeholder="Java, React, Node.js, Product Design" />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>About your hiring team</label>
                <textarea style={styles.textarea} name="bio" value={profile.bio} onChange={handleProfileChange} placeholder="Share what you hire for, your hiring style, and what candidates can expect." />
              </div>
              <button style={styles.btnSubmit} type="submit" disabled={profileSaving}>
                {profileSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
}

const statusStyle = (status) => {
  if (status === 'HIRED') return { ...styles.status, background: '#dcfce7', color: '#166534' };
  if (status === 'SHORTLISTED') return { ...styles.status, background: '#dbeafe', color: '#1d4ed8' };
  if (status === 'REJECTED') return { ...styles.status, background: '#fef2f2', color: '#dc2626' };
  return { ...styles.status, background: '#eff4ff', color: '#2563eb' };
};

function defaultInterviewTime() {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  date.setMinutes(0, 0, 0);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:00`;
}

function formatDateTime(value) {
  if (!value) return 'Not scheduled yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function getToastStyle(type) {
  if (type === 'error') return { ...styles.toast, ...styles.toastError };
  if (type === 'warning') return { ...styles.toast, ...styles.toastWarning };
  if (type === 'info') return { ...styles.toast, ...styles.toastInfo };
  return { ...styles.toast, ...styles.toastSuccess };
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function getInitials(name, email) {
  const source = (name || '').trim();
  if (source) {
    const parts = source.split(/\s+/).slice(0, 2);
    return parts.map((part) => part[0]?.toUpperCase() || '').join('') || 'SH';
  }
  return (email || 'SH').slice(0, 2).toUpperCase();
}

function getApplicationSortTime(application) {
  return new Date(application?.statusUpdatedAt || application?.appliedAt || 0).getTime();
}

function getApplicationStatusHistory(application) {
  if (Array.isArray(application?.statusHistory) && application.statusHistory.length) {
    return [...application.statusHistory].sort((a, b) => new Date(a.changedAt || 0) - new Date(b.changedAt || 0));
  }

  return [
    {
      status: application?.status || 'APPLIED',
      changedAt: application?.statusUpdatedAt || application?.appliedAt || null,
      message: application?.status === 'HIRED'
        ? 'Recruiter marked the candidate as hired.'
        : application?.status === 'REJECTED'
          ? 'Recruiter closed the application as rejected.'
          : application?.status === 'SHORTLISTED'
            ? 'Recruiter shortlisted the candidate for the next stage.'
            : 'Application submitted by candidate.',
    },
  ];
}

function getStatusLogMessage(entry) {
  if (entry?.message) return entry.message;
  if (entry?.status === 'HIRED') return 'Recruiter marked the candidate as hired.';
  if (entry?.status === 'REJECTED') return 'Recruiter closed the application as rejected.';
  if (entry?.status === 'SHORTLISTED') return 'Recruiter shortlisted the candidate for the next stage.';
  return 'Application submitted by candidate.';
}

const styles = {
  container: { minHeight: '100vh', background: 'linear-gradient(180deg, #ebe8df 0%, #f6f3ec 100%)' },
  shell: { display: 'grid', gridTemplateColumns: '300px minmax(0, 1fr)', minHeight: '100vh' },
  sidebar: { display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '28px 22px', background: '#0f172a', color: '#fff', borderRight: '1px solid rgba(255,255,255,0.08)', position: 'sticky', top: 0, height: '100vh' },
  brandBlock: { padding: '10px 10px 22px', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  logo: { fontFamily: 'Georgia, serif', fontSize: '28px', color: '#ffffff', marginBottom: '12px' },
  accent: { color: '#2563eb' },
  brandText: { fontSize: '13px', lineHeight: '1.7', color: 'rgba(255,255,255,0.68)' },
  sidebarGroup: { marginTop: '24px' },
  sidebarHeading: { padding: '0 10px', marginBottom: '10px', fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.52)' },
  sidebarTabs: { display: 'flex', flexDirection: 'column', gap: '8px' },
  sidebarTab: { display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left', padding: '14px 14px', borderRadius: '16px', border: '1px solid transparent', background: 'transparent', color: '#e5e7eb' },
  sidebarTabActive: { display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left', padding: '14px 14px', borderRadius: '16px', border: '1px solid rgba(45, 212, 191, 0.22)', background: 'linear-gradient(135deg, rgba(13,148,136,0.28) 0%, rgba(20,184,166,0.12) 100%)', color: '#ffffff', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' },
  sidebarTabLabel: { fontSize: '15px', fontWeight: '600' },
  sidebarTabHint: { fontSize: '12px', lineHeight: '1.5', color: 'rgba(255,255,255,0.68)' },
  sidebarFooter: { display: 'flex', flexDirection: 'column', gap: '12px' },
  sidebarProfileCard: { padding: '16px', borderRadius: '18px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' },
  sidebarIdentityRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  sidebarAvatarImage: { width: '50px', height: '50px', borderRadius: '16px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.18)' },
  sidebarAvatarFallback: { width: '50px', height: '50px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f766e 0%, #2dd4bf 100%)', color: '#fff', fontSize: '16px', fontWeight: '700' },
  sidebarProfileLabel: { fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.48)', marginBottom: '8px' },
  sidebarProfileName: { fontSize: '18px', fontWeight: '600', marginBottom: '6px' },
  sidebarProfileEmail: { fontSize: '12px', color: 'rgba(255,255,255,0.68)', lineHeight: '1.6' },
  sidebarLogout: { width: '100%', padding: '12px 14px', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '14px', background: 'transparent', color: '#fff', fontSize: '14px', fontWeight: '600' },
  workspace: { minWidth: 0, padding: '24px' },
  toastStack: { position: 'fixed', top: '26px', right: '30px', zIndex: 200, display: 'flex', flexDirection: 'column', gap: '10px', width: '320px' },
  toast: { display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '14px 16px', borderRadius: '16px', boxShadow: '0 20px 45px rgba(15, 23, 42, 0.14)', backdropFilter: 'blur(14px)', border: '1px solid transparent' },
  toastSuccess: { background: 'rgba(220, 252, 231, 0.96)', color: '#166534', borderColor: '#bbf7d0' },
  toastError: { background: 'rgba(254, 242, 242, 0.97)', color: '#b91c1c', borderColor: '#fecaca' },
  toastWarning: { background: 'rgba(255, 251, 235, 0.97)', color: '#b45309', borderColor: '#fde68a' },
  toastInfo: { background: 'rgba(219, 234, 254, 0.97)', color: '#1d4ed8', borderColor: '#bfdbfe' },
  toastDot: { width: '10px', height: '10px', borderRadius: '999px', background: 'currentColor', marginTop: '5px', flexShrink: 0 },
  toastText: { fontSize: '13px', lineHeight: '1.6', fontWeight: '600' },
  topbar: { position: 'relative', zIndex: 40, isolation: 'isolate', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '18px', marginBottom: '20px', padding: '20px 24px', background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,255,255,0.88)', borderRadius: '22px', backdropFilter: 'blur(16px)' },
  topbarEyebrow: { fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6b7280', marginBottom: '8px' },
  topbarTitle: { fontFamily: 'Georgia, serif', fontSize: '30px', color: '#111827', marginBottom: '6px' },
  topbarText: { fontSize: '14px', color: '#6b7280', lineHeight: '1.7' },
  topbarControls: { display: 'flex', alignItems: 'center', gap: '12px' },
  profileMenuShell: { position: 'relative', zIndex: 60 },
  profileTrigger: { display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '16px', background: '#fff', boxShadow: '0 8px 22px rgba(15, 23, 42, 0.05)' },
  profileTriggerImage: { width: '42px', height: '42px', borderRadius: '14px', objectFit: 'cover' },
  profileTriggerFallback: { width: '42px', height: '42px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f766e 0%, #2dd4bf 100%)', color: '#fff', fontSize: '14px', fontWeight: '700' },
  profileTriggerText: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, flex: 1 },
  profileTriggerName: { fontSize: '13px', fontWeight: '700', color: '#111827', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  profileTriggerMeta: { fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' },
  profileChevron: { fontSize: '12px', color: '#6b7280' },
  profileDropdown: { position: 'absolute', top: 'calc(100% + 10px)', right: 0, zIndex: 80, width: '280px', padding: '16px', borderRadius: '20px', background: '#ffffff', border: '1px solid #ece8e1', boxShadow: '0 24px 48px rgba(15, 23, 42, 0.14)' },
  profileDropdownHeader: { display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '14px', marginBottom: '12px', borderBottom: '1px solid #f1efea' },
  dropdownAvatarImage: { width: '52px', height: '52px', borderRadius: '16px', objectFit: 'cover' },
  dropdownAvatarFallback: { width: '52px', height: '52px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f766e 0%, #2dd4bf 100%)', color: '#fff', fontWeight: '700', fontSize: '16px' },
  dropdownName: { display: 'block', fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '4px' },
  dropdownEmail: { fontSize: '12px', lineHeight: '1.6', color: '#6b7280' },
  dropdownAction: { width: '100%', textAlign: 'left', padding: '11px 12px', borderRadius: '12px', border: 'none', background: '#f8fafc', color: '#111827', fontSize: '13px', fontWeight: '600', marginBottom: '8px' },
  dropdownLogout: { width: '100%', textAlign: 'left', padding: '11px 12px', borderRadius: '12px', border: '1px solid #fecaca', background: '#fff5f5', color: '#dc2626', fontSize: '13px', fontWeight: '700' },
  selectLabel: { display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', fontWeight: '600', color: '#4b5563' },
  sectionSelect: { minWidth: '220px', padding: '12px 14px', borderRadius: '14px', border: '1px solid #d6d3d1', background: '#ffffff', fontSize: '14px', color: '#111827', boxShadow: '0 6px 18px rgba(15, 23, 42, 0.06)' },
  msg: { background: '#dcfce7', color: '#166534', padding: '14px 18px', fontSize: '14px', borderRadius: '16px', border: '1px solid #bbf7d0', marginBottom: '18px' },
  content: { minWidth: 0 },
  heroCard: { display: 'flex', justifyContent: 'space-between', gap: '24px', alignItems: 'stretch', padding: '28px 32px', marginBottom: '28px', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 45%, #0f766e 100%)', color: '#fff', borderRadius: '24px', boxShadow: '0 22px 44px rgba(15, 23, 42, 0.16)' },
  heroEyebrow: { fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.18em', opacity: 0.72, marginBottom: '12px' },
  heroTitle: { fontFamily: 'Georgia, serif', fontSize: '34px', lineHeight: '1.1', marginBottom: '12px' },
  heroText: { maxWidth: '560px', fontSize: '15px', lineHeight: '1.7', color: 'rgba(255,255,255,0.82)' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(120px, 1fr))', gap: '12px', minWidth: '280px' },
  statCard: { display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '18px', borderRadius: '18px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)' },
  statLabel: { fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.72)' },
  statValue: { fontSize: '28px', fontWeight: '700', marginTop: '10px' },
  pageTitle: { fontFamily: 'Georgia, serif', fontSize: '36px', color: '#1a1a1a', marginBottom: '24px', letterSpacing: '-1px' },
  filterRow: { display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' },
  searchInput: { width: '100%', maxWidth: '360px', padding: '11px 14px', border: '1.5px solid #d6d3d1', borderRadius: '10px', fontSize: '14px', background: '#fff' },
  filterSelect: { minWidth: '190px', padding: '11px 14px', border: '1.5px solid #d6d3d1', borderRadius: '10px', fontSize: '14px', background: '#fff', color: '#111827' },
  countPill: { display: 'inline-flex', alignItems: 'center', padding: '10px 14px', borderRadius: '999px', background: '#eef2ff', color: '#3730a3', fontSize: '13px', fontWeight: '700' },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  jobCard: { background: '#fff', border: '1px solid #e2e1dd', borderRadius: '12px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' },
  hiredCard: { background: '#fff', border: '1px solid #d1fae5', borderRadius: '12px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' },
  historyStatsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px' },
  historySummaryCard: { padding: '18px', borderRadius: '18px', background: '#ffffff', border: '1px solid #e7e5e4', boxShadow: '0 16px 34px rgba(15, 23, 42, 0.05)' },
  historySummaryLabel: { display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#64748b', marginBottom: '10px' },
  historySummaryValue: { fontSize: '28px', fontWeight: '800', color: '#111827' },
  historyCardPositive: { background: '#ffffff', border: '1px solid #bbf7d0', borderRadius: '18px', padding: '22px 24px', boxShadow: '0 18px 36px rgba(34, 197, 94, 0.08)' },
  historyCardNegative: { background: '#ffffff', border: '1px solid #fecaca', borderRadius: '18px', padding: '22px 24px', boxShadow: '0 18px 36px rgba(239, 68, 68, 0.08)' },
  historyCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '6px' },
  jobTitle: { fontSize: '16px', fontWeight: '600', color: '#1a1a1a', marginBottom: '4px' },
  jobSub: { fontSize: '13px', color: '#6b6b6b', marginBottom: '8px' },
  skills: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  skill: { padding: '3px 10px', background: '#f0efeb', borderRadius: '100px', fontSize: '12px' },
  metaPill: { display: 'inline-flex', alignItems: 'center', padding: '6px 10px', borderRadius: '999px', background: '#eef2ff', color: '#4338ca', fontSize: '12px', fontWeight: '600' },
  jobActions: { display: 'flex', gap: '8px' },
  btnPrimary: { padding: '8px 16px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500' },
  formContainer: { maxWidth: '760px' },
  form: { background: '#fff', border: '1px solid #e2e1dd', borderRadius: '16px', padding: '32px' },
  profileHero: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #e2e1dd' },
  profileName: { fontSize: '24px', fontWeight: '600', color: '#1a1a1a', marginBottom: '6px' },
  profileSub: { fontSize: '14px', color: '#6b6b6b', maxWidth: '460px' },
  rolePill: { padding: '6px 12px', background: '#eff4ff', color: '#2563eb', borderRadius: '100px', fontSize: '12px', fontWeight: '600' },
  profileMediaCard: { marginBottom: '22px', padding: '18px', borderRadius: '20px', border: '1px solid #ece8e1', background: '#fcfcfb' },
  profileMediaRow: { display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '16px' },
  profileAvatarLargeImage: { width: '84px', height: '84px', borderRadius: '24px', objectFit: 'cover', boxShadow: '0 12px 28px rgba(15, 23, 42, 0.12)' },
  profileAvatarLargeFallback: { width: '84px', height: '84px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f766e 0%, #2dd4bf 100%)', color: '#fff', fontWeight: '700', fontSize: '24px', boxShadow: '0 12px 28px rgba(15, 23, 42, 0.12)' },
  profileMediaText: { flex: 1 },
  mediaTitle: { fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '6px' },
  mediaSub: { fontSize: '13px', lineHeight: '1.7', color: '#6b7280', maxWidth: '420px' },
  profileMediaActions: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  field: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' },
  input: { width: '100%', padding: '11px 14px', border: '1.5px solid #e2e1dd', borderRadius: '9px', fontSize: '14px', background: '#fff' },
  inputDisabled: { width: '100%', padding: '11px 14px', border: '1.5px solid #ece8e1', borderRadius: '9px', fontSize: '14px', background: '#f8f7f3', color: '#6b6b6b' },
  hiddenInput: { display: 'none' },
  textarea: { width: '100%', minHeight: '120px', padding: '11px 14px', border: '1.5px solid #e2e1dd', borderRadius: '9px', fontSize: '14px', background: '#fff', resize: 'vertical' },
  btnSubmit: { width: '100%', padding: '13px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: '9px', fontSize: '15px', fontWeight: '500', marginTop: '8px' },
  appCard: { background: '#fff', border: '1px solid #e2e1dd', borderRadius: '12px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' },
  coverLetter: { fontSize: '13px', color: '#6b6b6b', marginTop: '8px', maxWidth: '500px' },
  inlineLink: { display: 'inline-block', marginTop: '10px', color: '#2563eb', fontSize: '13px', fontWeight: '600' },
  fileLinks: { display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '10px' },
  timelineDetails: { marginTop: '14px', borderTop: '1px solid #ece8e1', paddingTop: '14px' },
  timelineSummary: { cursor: 'pointer', fontSize: '13px', fontWeight: '700', color: '#1d4ed8' },
  timelineList: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '14px' },
  timelineItem: { display: 'flex', gap: '12px', alignItems: 'flex-start' },
  timelineDot: { width: '10px', height: '10px', borderRadius: '999px', background: '#0f766e', marginTop: '10px', flexShrink: 0 },
  timelineBody: { flex: 1, minWidth: 0, padding: '14px 16px', borderRadius: '14px', background: '#fafaf9', border: '1px solid #ece8e1' },
  timelineHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' },
  timelineTime: { fontSize: '12px', color: '#64748b', fontWeight: '600' },
  timelineMessage: { fontSize: '13px', color: '#4b5563', lineHeight: '1.7' },
  appActions: { display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' },
  status: { padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: '500' },
  statusPending: { padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: '500', background: '#eff4ff', color: '#2563eb' },
  btnInfo: { padding: '8px 16px', background: '#dbeafe', color: '#1d4ed8', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500' },
  btnHire: { padding: '8px 16px', background: '#dcfce7', color: '#166534', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600' },
  btnDanger: { padding: '8px 16px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500' },
  hiredBadge: { padding: '6px 14px', borderRadius: '100px', fontSize: '12px', fontWeight: '700', background: '#dcfce7', color: '#166534' },
  mockAttemptsSection: { marginTop: '28px' },
  mockAttemptsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '18px' },
  mockAttemptCard: { background: '#fff', border: '1px solid #e2e1dd', borderRadius: '18px', padding: '22px 24px', boxShadow: '0 18px 36px rgba(15, 23, 42, 0.05)' },
  mockAttemptHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '14px' },
  mockAttemptBadges: { display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' },
  mockScoreBadge: { padding: '6px 12px', borderRadius: '999px', background: '#dcfce7', color: '#166534', fontSize: '12px', fontWeight: '700' },
  pendingAttemptBadge: { padding: '6px 12px', borderRadius: '999px', background: '#eff6ff', color: '#1d4ed8', fontSize: '12px', fontWeight: '700' },
  mockAttemptMeta: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' },
  evaluationSummary: { fontSize: '13px', color: '#475569', lineHeight: '1.7', marginBottom: '10px' },
  evaluationBlock: { marginBottom: '10px' },
  evaluationTitle: { fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#64748b', marginBottom: '8px' },
  evaluationChipWrap: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  positiveChip: { display: 'inline-flex', alignItems: 'center', padding: '8px 10px', borderRadius: '999px', background: '#dcfce7', color: '#166534', fontSize: '12px', fontWeight: '600' },
  warningChip: { display: 'inline-flex', alignItems: 'center', padding: '8px 10px', borderRadius: '999px', background: '#fff7ed', color: '#c2410c', fontSize: '12px', fontWeight: '600' },
  answersDetails: { marginTop: '14px', borderTop: '1px solid #ece8e1', paddingTop: '14px' },
  answersSummary: { cursor: 'pointer', fontSize: '13px', fontWeight: '700', color: '#1d4ed8' },
  answerReviewList: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '14px' },
  answerReviewCard: { padding: '16px', borderRadius: '14px', background: '#fafaf9', border: '1px solid #ece8e1' },
  answerQuestion: { fontSize: '13px', fontWeight: '700', color: '#111827', lineHeight: '1.6', marginBottom: '8px' },
  answerText: { fontSize: '13px', color: '#4b5563', lineHeight: '1.7', whiteSpace: 'pre-wrap' },
  empty: { color: '#6b6b6b', fontSize: '15px' },
};
