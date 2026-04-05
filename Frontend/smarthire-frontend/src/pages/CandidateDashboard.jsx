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

const emptyApplicationForm = {
  coverLetter: '',
  resumeFileName: '',
  resumeFileData: '',
  cvFileName: '',
  cvFileData: '',
};

const candidateTabs = [
  { id: 'jobs', label: 'Jobs', hint: 'Discover roles and apply' },
  { id: 'applications', label: 'Applications', hint: 'Track your pipeline' },
  { id: 'mock-tests', label: 'Mock Tests', hint: 'Practice curated rounds' },
  { id: 'live-interviews', label: 'Live Interviews', hint: 'Manage recruiter meetings' },
  { id: 'offers', label: 'History', hint: 'Review hired and rejected outcomes' },
  { id: 'profile', label: 'Profile', hint: 'Keep your profile ready' },
];

export default function CandidateDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('jobs');
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [profile, setProfile] = useState(emptyProfile);
  const [selectedJobForApply, setSelectedJobForApply] = useState(null);
  const [applicationForm, setApplicationForm] = useState(emptyApplicationForm);
  const [activeInterviewId, setActiveInterviewId] = useState(null);
  const [interviewAnswers, setInterviewAnswers] = useState([]);
  const [mockDeadline, setMockDeadline] = useState(null);
  const [mockTimeLeft, setMockTimeLeft] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({
    jobId: '',
    interviewType: 'HR',
    scheduledFor: defaultInterviewTime(),
    durationMinutes: 45,
    notes: '',
  });
  const [search, setSearch] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('ALL');
  const [applicationStatusFilter, setApplicationStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const autoSubmitRef = useRef(false);
  const resumeInputRef = useRef(null);
  const cvInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    if (!user?.email) return;
    loadJobs();
    loadApplications();
    loadInterviews();
    loadProfile();
  }, [user?.email]);

  useEffect(() => {
    if (!selectedJobForApply) return undefined;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        closeApplicationPanel();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [selectedJobForApply]);

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

  useEffect(() => {
    if (!activeInterviewId || !mockDeadline) return undefined;

    const tick = () => {
      const remaining = Math.max(0, mockDeadline - Date.now());
      setMockTimeLeft(remaining);

      if (remaining === 0 && !autoSubmitRef.current) {
        autoSubmitRef.current = true;
        handleSubmitMockTest(true);
      }
    };

    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [activeInterviewId, mockDeadline]);

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
      setJobs(res.data);
      setRequestForm((current) => ({
        ...current,
        jobId: current.jobId || res.data?.[0]?.id || '',
      }));
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
    } catch (err) {}
  };

  const openApplicationPanel = (job) => {
    setSelectedJobForApply(job);
    setApplicationForm({
      ...emptyApplicationForm,
      coverLetter: `I am interested in the ${job.title} role at ${job.company}. My background aligns well with the job requirements.`,
    });
  };

  const closeApplicationPanel = () => {
    setSelectedJobForApply(null);
    setApplicationForm(emptyApplicationForm);
  };

  const handleApplicationFieldChange = (e) => {
    setApplicationForm({ ...applicationForm, [e.target.name]: e.target.value });
  };

  const openFilePicker = (type) => {
    if (type === 'resume') {
      resumeInputRef.current?.click();
      return;
    }
    cvInputRef.current?.click();
  };

  const clearApplicationFile = (type) => {
    if (type === 'resume') {
      setApplicationForm((current) => ({
        ...current,
        resumeFileName: '',
        resumeFileData: '',
      }));
      if (resumeInputRef.current) {
        resumeInputRef.current.value = '';
      }
      showMessage('Resume removed from this application.', 'info');
      return;
    }

    setApplicationForm((current) => ({
      ...current,
      cvFileName: '',
      cvFileData: '',
    }));
    if (cvInputRef.current) {
      cvInputRef.current.value = '';
    }
    showMessage('CV removed from this application.', 'info');
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

  const handleApplicationFileChange = async (e) => {
    const { name, files } = e.target;
    const file = files?.[0];
    if (!file) return;
    const data = await readFileAsDataUrl(file);
    if (name === 'resume') {
      setApplicationForm((current) => ({
        ...current,
        resumeFileName: file.name,
        resumeFileData: data,
      }));
      showMessage(`Resume attached: ${file.name}`, 'info');
    } else {
      setApplicationForm((current) => ({
        ...current,
        cvFileName: file.name,
        cvFileData: data,
      }));
      showMessage(`CV attached: ${file.name}`, 'info');
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!selectedJobForApply) return;
    if (!applicationForm.resumeFileData && !applicationForm.cvFileData) {
      showMessage('Attach at least a resume or CV before submitting.', 'error');
      return;
    }
    setLoading(true);
    try {
      await applicationAPI.applyForJob({
        candidateEmail: user.email,
        candidateName: [profile.firstName, profile.lastName].filter(Boolean).join(' '),
        candidatePhone: profile.phone,
        candidateHeadline: profile.headline,
        candidateSkills: profile.skills
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean),
        jobId: selectedJobForApply.id,
        coverLetter: applicationForm.coverLetter,
        resumeFileName: applicationForm.resumeFileName,
        resumeFileData: applicationForm.resumeFileData,
        cvFileName: applicationForm.cvFileName,
        cvFileData: applicationForm.cvFileData,
      });
      await loadApplications();
      closeApplicationPanel();
      setActiveTab('applications');
      showMessage('Application submitted successfully!', 'success');
    } catch (err) {
      showMessage('You may have already applied or there was an error.', 'error');
    }
    setLoading(false);
  };

  const handleScheduleInterview = async (job) => {
    setLoading(true);
    try {
      const res = await createMockTestAttempt({
        recruiterEmail: job.postedBy,
        company: job.company,
        jobId: job.id,
        jobTitle: job.title,
        roleFocus: job.title,
        difficulty: 'MEDIUM',
      });
      await loadInterviews();
      setActiveTab('mock-tests');
      startMockTest(res.data);
      showMessage('Mock test ready. Your timer starts now.', 'success');
    } catch (err) {
      showMessage('Error scheduling mock test!', 'error');
    }
    setLoading(false);
  };

  const createMockTestAttempt = async ({ recruiterEmail, company, jobId, jobTitle, roleFocus, difficulty }) => (
    interviewAPI.scheduleInterview({
      candidateEmail: user.email,
      recruiterEmail,
      company,
      jobId,
      jobTitle,
      interviewType: 'AI_MOCK',
      roleFocus: roleFocus || jobTitle,
      difficulty: difficulty || 'MEDIUM',
      scheduledBy: 'CANDIDATE',
      scheduledFor: new Date().toISOString().slice(0, 16),
      durationMinutes: 30,
      videoEnabled: false,
      notes: 'Candidate launched an on-demand mock test.',
    })
  );

  const handleRetakeMockTest = async (interview) => {
    setLoading(true);
    try {
      const res = await createMockTestAttempt({
        recruiterEmail: interview.recruiterEmail,
        company: interview.company,
        jobId: interview.jobId,
        jobTitle: interview.jobTitle,
        roleFocus: interview.roleFocus,
        difficulty: interview.difficulty,
      });
      await loadInterviews();
      setActiveTab('mock-tests');
      startMockTest(res.data);
      showMessage('New mock-test attempt created. This attempt will also be visible to the recruiter.', 'success');
    } catch (err) {
      showMessage('Error creating a new mock-test attempt!', 'error');
    }
    setLoading(false);
  };

  const handleRequestFormChange = (e) => {
    setRequestForm({ ...requestForm, [e.target.name]: e.target.value });
  };

  const handleRequestInterview = async (e) => {
    e.preventDefault();
    const selectedJob = jobs.find((job) => job.id === requestForm.jobId);
    if (!selectedJob) {
      showMessage('Select a job first.', 'error');
      return;
    }

    try {
      await interviewAPI.scheduleInterview({
        candidateEmail: user.email,
        recruiterEmail: selectedJob.postedBy,
        company: selectedJob.company,
        jobId: selectedJob.id,
        jobTitle: selectedJob.title,
        interviewType: requestForm.interviewType,
        roleFocus: selectedJob.title,
        scheduledBy: 'CANDIDATE',
        scheduledFor: requestForm.scheduledFor,
        durationMinutes: Number(requestForm.durationMinutes),
        videoEnabled: true,
        notes: requestForm.notes,
      });
      await loadInterviews();
      showMessage('Interview request sent to recruiter!', 'success');
    } catch (err) {
      showMessage('Error requesting interview!', 'error');
    }
  };

  const handleInterviewResponse = async (interviewId, accepted) => {
    try {
      await interviewAPI.respondToInterview(interviewId, {
        role: 'CANDIDATE',
        accepted,
      });
      await loadInterviews();
      showMessage(accepted ? 'Interview confirmed.' : 'Interview declined.', accepted ? 'success' : 'info');
    } catch (err) {
      showMessage('Error updating interview response!', 'error');
    }
  };

  const startMockTest = (interview) => {
    setActiveInterviewId(interview.id);
    setInterviewAnswers(
      interview.answers?.length
        ? interview.answers
        : new Array(interview.questions?.length || 0).fill('')
    );
    setCurrentQuestionIndex(0);
    setMockDeadline(Date.now() + (interview.durationMinutes || 30) * 60 * 1000);
    setMockTimeLeft((interview.durationMinutes || 30) * 60 * 1000);
    autoSubmitRef.current = false;
  };

  const openMockTest = (interview) => {
    startMockTest(interview);
    showMessage('Mock test started. Answer all questions before the timer ends.', 'info');
  };

  const handleAnswerChange = (index, value) => {
    setInterviewAnswers((current) => current.map((answer, answerIndex) => answerIndex === index ? value : answer));
  };

  const handleSubmitMockTest = async (autoTriggered = false) => {
    if (!activeInterviewId) return;
    try {
      await interviewAPI.completeInterview(activeInterviewId, interviewAnswers);
      await loadInterviews();
      showMessage(
        autoTriggered ? 'Time is up. Your mock test was auto-submitted.' : 'Mock interview submitted successfully!',
        autoTriggered ? 'warning' : 'success'
      );
      setActiveInterviewId(null);
      setInterviewAnswers([]);
      setMockDeadline(null);
      setMockTimeLeft(0);
      setCurrentQuestionIndex(0);
    } catch (err) {
      showMessage('Error submitting mock interview!', 'error');
      autoSubmitRef.current = false;
    }
  };

  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
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

  const filteredJobs = jobs.filter((job) =>
    (job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.company.toLowerCase().includes(search.toLowerCase()) ||
      job.location.toLowerCase().includes(search.toLowerCase())) &&
    (jobTypeFilter === 'ALL' || job.jobType === jobTypeFilter)
  );

  const mockTests = interviews.filter((interview) => interview.interviewType === 'AI_MOCK');
  const liveInterviews = interviews.filter((interview) => interview.interviewType !== 'AI_MOCK');
  const hiredApplications = applications.filter((app) => app.status === 'HIRED');
  const rejectedApplications = applications.filter((app) => app.status === 'REJECTED');
  const decisionApplications = [...applications]
    .filter((app) => app.status === 'HIRED' || app.status === 'REJECTED')
    .sort((a, b) => getApplicationSortTime(b) - getApplicationSortTime(a));
  const profileName = [profile.firstName, profile.lastName].filter(Boolean).join(' ');
  const shortlistedApplications = applications.filter((app) => app.status === 'SHORTLISTED');
  const activeTabConfig = candidateTabs.find((tab) => tab.id === activeTab) || candidateTabs[0];
  const activeMockTest = mockTests.find((interview) => interview.id === activeInterviewId) || null;
  const answeredQuestions = interviewAnswers.filter((answer) => answer?.trim()).length;
  const currentQuestionLink = activeMockTest?.questionLinks?.[currentQuestionIndex] || guessLeetCodeLink(activeMockTest?.questions?.[currentQuestionIndex]);
  const sortedMockTests = [...mockTests].sort((a, b) => new Date(b.completedAt || b.scheduledAt || 0) - new Date(a.completedAt || a.scheduledAt || 0));
  const filteredApplications = [...applications]
    .filter((app) => applicationStatusFilter === 'ALL' || app.status === applicationStatusFilter)
    .sort((a, b) => getApplicationSortTime(b) - getApplicationSortTime(a));
  const displayName = profileName || 'Candidate';
  const avatarLabel = getInitials(displayName, user?.email);

  return (
    <div style={styles.container}>
      <div style={styles.shell}>
        <aside style={styles.sidebar}>
          <div>
            <div style={styles.brandBlock}>
              <h1 style={styles.logo}>Smart<span style={styles.accent}>Hire</span></h1>
              <p style={styles.brandText}>Candidate workspace for applications, mock tests, interviews, and offers.</p>
            </div>

            <div style={styles.sidebarGroup}>
              <p style={styles.sidebarHeading}>Workspace</p>
              <div style={styles.sidebarTabs}>
                {candidateTabs.map((tab) => (
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
                  {candidateTabs.map((tab) => (
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
                    <span style={styles.profileTriggerMeta}>{profile.role || 'CANDIDATE'}</span>
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
                    <button style={styles.dropdownAction} type="button" onClick={() => { setActiveTab('applications'); setProfileMenuOpen(false); }}>
                      View applications
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
            <p style={styles.heroEyebrow}>Candidate Workspace</p>
            <h2 style={styles.heroTitle}>{profileName || 'Build your hiring journey'}</h2>
            <p style={styles.heroText}>
              Keep mock tests, live recruiter interviews, applications, and final hiring decisions in one clean workflow.
            </p>
          </div>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <span style={styles.statLabel}>Open Jobs</span>
              <strong style={styles.statValue}>{jobs.length}</strong>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statLabel}>Applications</span>
              <strong style={styles.statValue}>{applications.length}</strong>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statLabel}>Shortlisted</span>
              <strong style={styles.statValue}>{shortlistedApplications.length}</strong>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statLabel}>Offers</span>
              <strong style={styles.statValue}>{hiredApplications.length}</strong>
            </div>
          </div>
        </div>

        {activeTab === 'jobs' && (
          <div>
            <h2 style={styles.pageTitle}>Find your next role</h2>
            <p style={styles.sectionText}>Browse opportunities, then apply with a proper cover letter plus resume/CV upload from the same section.</p>
            <div style={styles.filterRow}>
              <input
                style={styles.search}
                placeholder="Search jobs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select style={styles.filterSelect} value={jobTypeFilter} onChange={(e) => setJobTypeFilter(e.target.value)}>
                <option value="ALL">All job types</option>
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="REMOTE">Remote</option>
              </select>
            </div>
            <div style={styles.jobsGrid}>
              {filteredJobs.map((job) => (
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
                    {job.skills?.map((skill, index) => (
                      <span key={index} style={styles.skill}>{skill}</span>
                    ))}
                  </div>
                  <div style={styles.jobFooter}>
                    <span style={styles.salary}>{job.salary}</span>
                    <div style={styles.jobActions}>
                      <button style={styles.btnSecondary} onClick={() => handleScheduleInterview(job)} disabled={loading}>
                        Start Mock Test
                      </button>
                      <button style={styles.btnPrimary} onClick={() => openApplicationPanel(job)} disabled={loading}>
                        Apply with Resume
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
            <p style={styles.sectionText}>Track your hiring progress, review complete status logs, and keep quick access to the resume/CV files you submitted.</p>
            <div style={styles.filterRow}>
              <div style={styles.countPill}>{applications.length} total applications</div>
              <select style={styles.filterSelect} value={applicationStatusFilter} onChange={(e) => setApplicationStatusFilter(e.target.value)}>
                <option value="ALL">All statuses</option>
                <option value="PENDING">Pending</option>
                <option value="SHORTLISTED">Shortlisted</option>
                <option value="HIRED">Hired</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            {applications.length === 0 ? (
              <p style={styles.empty}>No applications yet. Start applying!</p>
            ) : (
              <div style={styles.list}>
                {filteredApplications.map((app) => (
                  <div key={app.id} style={styles.listCard}>
                    <div>
                      <h3 style={styles.listTitle}>{app.jobTitle}</h3>
                      <p style={styles.listSub}>{app.company}</p>
                      <p style={styles.listDate}>Applied: {new Date(app.appliedAt).toLocaleDateString()}</p>
                      <p style={styles.listDate}>Latest update: {formatDateTime(app.statusUpdatedAt || app.appliedAt)}</p>
                      <div style={styles.fileLinks}>
                        {app.resumeFileData && <a href={app.resumeFileData} download={app.resumeFileName || 'resume'} style={styles.inlineLink}>Download Resume</a>}
                        {app.cvFileData && <a href={app.cvFileData} download={app.cvFileName || 'cv'} style={styles.inlineLink}>Download CV</a>}
                      </div>
                      <details style={styles.timelineDetails}>
                        <summary style={styles.timelineSummary}>View status log</summary>
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
                    <span style={statusStyle(app.status)}>{app.status}</span>
                  </div>
                ))}
              </div>
            )}
            {applications.length > 0 && filteredApplications.length === 0 && (
              <p style={styles.empty}>No applications match the selected status filter.</p>
            )}
          </div>
        )}

        {activeTab === 'mock-tests' && (
          <div>
            <h2 style={styles.pageTitle}>Timed Mock Tests</h2>
            <p style={styles.sectionText}>Each mock test now opens as a proper timed round with question navigation, live progress, and related official LeetCode practice links for coding problems.</p>
            {mockTests.length === 0 ? (
              <p style={styles.empty}>No mock tests yet. Start one from the Jobs section.</p>
            ) : (
              <div style={styles.list}>
                {sortedMockTests.map((interview, index) => (
                  <div key={interview.id} style={styles.mockListCard}>
                    <div>
                      <h3 style={styles.listTitle}>{interview.jobTitle}</h3>
                      <p style={styles.listSub}>{interview.questionSource || 'SmartHire curated'} · {(interview.questionTopics || []).join(', ')}</p>
                      <div style={styles.mockMetaRow}>
                        <span style={styles.metaPill}>Attempt #{sortedMockTests.length - index}</span>
                        <span style={styles.metaPill}>{interview.questions?.length || 0} questions</span>
                        <span style={styles.metaPill}>{interview.durationMinutes || 30} min</span>
                        <span style={styles.metaPill}>{interview.difficulty || 'MEDIUM'}</span>
                      </div>
                      {interview.status === 'COMPLETED' && (
                        <div style={styles.evaluationCard}>
                          <div style={styles.evaluationHeader}>
                            <span style={styles.evaluationScore}>Score {interview.score ?? 0}/10</span>
                            <span style={styles.evaluationMeta}>
                              Answered {interview.answeredCount || 0}/{interview.questions?.length || 0}
                            </span>
                          </div>
                          <p style={styles.score}>{interview.feedback}</p>
                          {interview.evaluationSummary && <p style={styles.evaluationSummary}>{interview.evaluationSummary}</p>}
                          <details style={styles.answersDetails}>
                            <summary style={styles.answersSummary}>View evaluation details</summary>
                            <div style={styles.evaluationDetails}>
                              {!!interview.strengths?.length && (
                                <div>
                                  <p style={styles.evaluationListTitle}>Strengths</p>
                                  <div style={styles.evaluationChipWrap}>
                                    {interview.strengths.map((item, itemIndex) => (
                                      <span key={`${interview.id}-strength-${itemIndex}`} style={styles.positiveChip}>{item}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {!!interview.improvementAreas?.length && (
                                <div>
                                  <p style={styles.evaluationListTitle}>Improve next</p>
                                  <div style={styles.evaluationChipWrap}>
                                    {interview.improvementAreas.map((item, itemIndex) => (
                                      <span key={`${interview.id}-improve-${itemIndex}`} style={styles.warningChip}>{item}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </details>
                        </div>
                      )}
                    </div>
                    <div style={styles.interviewActions}>
                      <span style={interview.status === 'COMPLETED' ? styles.statusSuccess : styles.statusInfo}>{interview.status}</span>
                      {interview.status !== 'COMPLETED' ? (
                        <button style={styles.btnPrimary} onClick={() => openMockTest(interview)}>Start Timed Test</button>
                      ) : (
                        <button style={styles.btnInfo} onClick={() => handleRetakeMockTest(interview)} disabled={loading}>Retake Test</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeMockTest && (
              <div style={styles.mockTestShell}>
                <aside style={styles.mockSidebar}>
                  <div style={styles.mockSidebarCard}>
                    <p style={styles.mockSidebarLabel}>Active test</p>
                    <h3 style={styles.profileName}>{activeMockTest.jobTitle}</h3>
                    <p style={styles.profileSub}>{activeMockTest.company || 'SmartHire'} · {activeMockTest.questions?.length || 0} questions</p>
                    <div style={styles.timerCard}>
                      <span style={styles.timerLabel}>Time left</span>
                      <strong style={styles.timerValue}>{formatCountdown(mockTimeLeft)}</strong>
                      <span style={styles.timerHint}>Auto-submit runs when the countdown reaches zero.</span>
                    </div>
                    <div style={styles.progressCard}>
                      <div style={styles.progressHeader}>
                        <span style={styles.progressLabel}>Answered</span>
                        <span style={styles.progressValue}>{answeredQuestions}/{activeMockTest.questions?.length || 0}</span>
                      </div>
                      <div style={styles.progressTrack}>
                        <div
                          style={{
                            ...styles.progressFill,
                            width: `${((answeredQuestions || 0) / Math.max(activeMockTest.questions?.length || 1, 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={styles.mockSidebarCard}>
                    <p style={styles.mockSidebarLabel}>Question navigator</p>
                    <div style={styles.questionNavGrid}>
                      {(activeMockTest.questions || []).map((_, index) => (
                        <button
                          key={index}
                          type="button"
                          style={getQuestionNavStyle(index, currentQuestionIndex, interviewAnswers[index])}
                          onClick={() => setCurrentQuestionIndex(index)}
                        >
                          {index + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                </aside>

                <div style={styles.mockMain}>
                  <div style={styles.mockQuestionCard}>
                    <div style={styles.mockQuestionHeader}>
                      <div>
                        <p style={styles.mockSidebarLabel}>Question {currentQuestionIndex + 1}</p>
                        <h3 style={styles.profileName}>Solve this round carefully</h3>
                      </div>
                      <span style={styles.metaPill}>
                        {(activeMockTest.questionTopics || [])[Math.min(currentQuestionIndex, (activeMockTest.questionTopics || []).length - 1)] || 'Coding'}
                      </span>
                    </div>

                    <p style={styles.question}>{activeMockTest.questions?.[currentQuestionIndex]}</p>

                    {currentQuestionLink && (
                      <a href={currentQuestionLink} target="_blank" rel="noreferrer" style={styles.practiceLink}>
                        Open related LeetCode practice
                      </a>
                    )}

                    <textarea
                      style={styles.mockTextarea}
                      value={interviewAnswers[currentQuestionIndex] || ''}
                      onChange={(e) => handleAnswerChange(currentQuestionIndex, e.target.value)}
                      placeholder="Write your full answer, approach, edge cases, and complexity here..."
                    />

                    <div style={styles.mockFooter}>
                      <button
                        type="button"
                        style={styles.btnSecondary}
                        onClick={() => setCurrentQuestionIndex((current) => Math.max(current - 1, 0))}
                        disabled={currentQuestionIndex === 0}
                      >
                        Previous
                      </button>
                      <div style={styles.mockFooterActions}>
                        {currentQuestionIndex < (activeMockTest.questions?.length || 0) - 1 && (
                          <button
                            type="button"
                            style={styles.btnInfo}
                            onClick={() => setCurrentQuestionIndex((current) => Math.min(current + 1, (activeMockTest.questions?.length || 1) - 1))}
                          >
                            Next Question
                          </button>
                        )}
                        <button style={styles.btnSubmitInline} type="button" onClick={() => handleSubmitMockTest(false)}>
                          Submit Test
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'live-interviews' && (
          <div>
            <h2 style={styles.pageTitle}>Live Interviews</h2>
            <p style={styles.sectionText}>Request HR or technical interviews, confirm schedules, and join shared video-call links.</p>
            <div style={styles.formContainer}>
              <form onSubmit={handleRequestInterview} style={styles.form}>
                <div style={styles.profileHero}>
                  <div>
                    <h3 style={styles.profileName}>Request Recruiter Interview</h3>
                    <p style={styles.profileSub}>Pick a job, choose the type, and suggest a time. Recruiters can confirm from their side.</p>
                  </div>
                  <span style={styles.rolePill}>VIDEO READY</span>
                </div>
                <div style={styles.row}>
                  <div style={styles.field}>
                    <label style={styles.label}>Job</label>
                    <select style={styles.input} name="jobId" value={requestForm.jobId} onChange={handleRequestFormChange}>
                      {jobs.map((job) => (
                        <option key={job.id} value={job.id}>{job.title} · {job.company}</option>
                      ))}
                    </select>
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Interview type</label>
                    <select style={styles.input} name="interviewType" value={requestForm.interviewType} onChange={handleRequestFormChange}>
                      <option value="HR">HR</option>
                      <option value="TECHNICAL">Technical</option>
                    </select>
                  </div>
                </div>
                <div style={styles.row}>
                  <div style={styles.field}>
                    <label style={styles.label}>Suggested time</label>
                    <input style={styles.input} type="datetime-local" name="scheduledFor" value={requestForm.scheduledFor} onChange={handleRequestFormChange} />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Duration (minutes)</label>
                    <input style={styles.input} type="number" min="15" step="15" name="durationMinutes" value={requestForm.durationMinutes} onChange={handleRequestFormChange} />
                  </div>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Notes</label>
                  <textarea style={styles.textarea} name="notes" value={requestForm.notes} onChange={handleRequestFormChange} placeholder="Share agenda, topics, or availability details." />
                </div>
                <button style={styles.btnSubmit} type="submit">Request Interview</button>
              </form>
            </div>

            {liveInterviews.length === 0 ? (
              <p style={styles.empty}>No interviews scheduled yet.</p>
            ) : (
              <div style={styles.list}>
                {liveInterviews.map((interview) => (
                  <div key={interview.id} style={styles.listCard}>
                    <div>
                      <h3 style={styles.listTitle}>{interview.jobTitle}</h3>
                      <p style={styles.listSub}>{interview.company || 'SmartHire'} · {interview.interviewType}</p>
                      <p style={styles.listDate}>Scheduled for: {formatDateTime(interview.scheduledFor || interview.scheduledAt)}</p>
                      {interview.score > 0 && (
                        <p style={styles.score}>Score: {interview.score}/10 | {interview.feedback}</p>
                      )}
                      {interview.videoMeetingLink && interview.interviewType !== 'AI_MOCK' && (
                        <a href={interview.videoMeetingLink} target="_blank" rel="noreferrer" style={styles.inlineLink}>Join video call</a>
                      )}
                      {interview.notes && <p style={styles.note}>{interview.notes}</p>}
                    </div>
                    <div style={styles.interviewActions}>
                      <span style={interview.status === 'COMPLETED' ? styles.statusSuccess : styles.statusInfo}>
                        {interview.status}
                      </span>
                      {interview.interviewType === 'AI_MOCK' && interview.status !== 'COMPLETED' && (
                        <button style={styles.btnPrimary} onClick={() => openMockTest(interview)}>Start Mock Test</button>
                      )}
                      {interview.status === 'PENDING_CONFIRMATION' && !interview.candidateConfirmed && (
                        <>
                          <button style={styles.btnInfo} onClick={() => handleInterviewResponse(interview.id, true)}>Accept</button>
                          <button style={styles.btnDanger} onClick={() => handleInterviewResponse(interview.id, false)}>Decline</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'offers' && (
          <div>
            <h2 style={styles.pageTitle}>Decision History</h2>
            <p style={styles.sectionText}>Review your final outcomes in one place, including hired and rejected decisions with complete application logs.</p>
            <div style={styles.historyStatsGrid}>
              <div style={styles.historySummaryCard}>
                <span style={styles.historySummaryLabel}>Hired</span>
                <strong style={styles.historySummaryValue}>{hiredApplications.length}</strong>
              </div>
              <div style={styles.historySummaryCard}>
                <span style={styles.historySummaryLabel}>Rejected</span>
                <strong style={styles.historySummaryValue}>{rejectedApplications.length}</strong>
              </div>
              <div style={styles.historySummaryCard}>
                <span style={styles.historySummaryLabel}>Final Decisions</span>
                <strong style={styles.historySummaryValue}>{decisionApplications.length}</strong>
              </div>
            </div>
            {decisionApplications.length === 0 ? (
              <p style={styles.empty}>No hired or rejected decisions yet. Your final outcomes will appear here.</p>
            ) : (
              <div style={styles.list}>
                {decisionApplications.map((app) => (
                  <div key={app.id} style={app.status === 'HIRED' ? styles.historyCardPositive : styles.historyCardNegative}>
                    <div>
                      <div style={styles.historyCardHeader}>
                        <div>
                          <h3 style={styles.listTitle}>{app.jobTitle}</h3>
                          <p style={styles.listSub}>{app.company}</p>
                        </div>
                        <span style={statusStyle(app.status)}>{app.status}</span>
                      </div>
                      <p style={styles.listDate}>Latest update: {formatDateTime(app.statusUpdatedAt || app.appliedAt)}</p>
                      <details style={styles.timelineDetails}>
                        <summary style={styles.timelineSummary}>Open complete log</summary>
                        <div style={styles.timelineList}>
                          {getApplicationStatusHistory(app).map((entry, index) => (
                            <div key={`${app.id}-decision-${index}`} style={styles.timelineItem}>
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
            <h2 style={styles.pageTitle}>My Profile</h2>
            <form onSubmit={handleProfileSave} style={styles.form}>
              <div style={styles.profileHero}>
                <div>
                  <h3 style={styles.profileName}>{displayName || user?.email}</h3>
                  <p style={styles.profileSub}>{profile.headline || 'Add a headline to describe your strengths.'}</p>
                </div>
                <span style={styles.rolePill}>{profile.role || 'CANDIDATE'}</span>
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
                    <p style={styles.mediaSub}>Add a professional photo or a clean personal avatar for a stronger first impression.</p>
                  </div>
                </div>
                <div style={styles.profileMediaActions}>
                  <input ref={avatarInputRef} style={styles.hiddenInput} type="file" accept="image/*" onChange={handleAvatarUpload} />
                  <button style={styles.btnPrimary} type="button" onClick={() => avatarInputRef.current?.click()}>Upload image</button>
                  {profile.avatarImageData && <button style={styles.btnSecondary} type="button" onClick={clearAvatar}>Remove image</button>}
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
                  <label style={styles.label}>Phone</label>
                  <input style={styles.input} name="phone" value={profile.phone} onChange={handleProfileChange} />
                </div>
              </div>
              <div style={styles.row}>
                <div style={styles.field}>
                  <label style={styles.label}>Location</label>
                  <input style={styles.input} name="location" value={profile.location} onChange={handleProfileChange} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Experience (years)</label>
                  <input style={styles.input} name="experienceYears" type="number" min="0" value={profile.experienceYears} onChange={handleProfileChange} />
                </div>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Headline</label>
                <input style={styles.input} name="headline" value={profile.headline} onChange={handleProfileChange} placeholder="e.g. Backend developer focused on Java and distributed systems" />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Skills</label>
                <input style={styles.input} name="skills" value={profile.skills} onChange={handleProfileChange} placeholder="Java, Spring Boot, MongoDB" />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Bio</label>
                <textarea style={styles.textarea} name="bio" value={profile.bio} onChange={handleProfileChange} placeholder="Share your background, strengths, and the roles you want." />
              </div>
              <button style={styles.btnSubmit} type="submit" disabled={profileSaving}>
                {profileSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </div>
        )}
          {selectedJobForApply && (
            <div style={styles.applicationModalBackdrop} onClick={closeApplicationPanel}>
              <div style={styles.applicationModal} onClick={(e) => e.stopPropagation()}>
                <div style={styles.profileHero}>
                  <div>
                    <h3 style={styles.profileName}>Apply for {selectedJobForApply.title}</h3>
                    <p style={styles.profileSub}>{selectedJobForApply.company} · {selectedJobForApply.location}</p>
                  </div>
                  <button style={styles.modalCloseBtn} type="button" onClick={closeApplicationPanel}>Close</button>
                </div>
                <form onSubmit={handleApply}>
                  <div style={styles.field}>
                    <label style={styles.label}>Cover letter</label>
                    <textarea style={styles.textarea} name="coverLetter" value={applicationForm.coverLetter} onChange={handleApplicationFieldChange} />
                  </div>
                  <div style={styles.uploadPanel}>
                    <div style={styles.uploadCard}>
                      <div style={styles.uploadHeader}>
                        <div>
                          <label style={styles.label}>Resume file</label>
                          <p style={styles.uploadHelp}>Upload your main resume in `PDF`, `DOC`, or `DOCX` format.</p>
                        </div>
                        <span style={styles.uploadRequired}>Recommended</span>
                      </div>
                      <input
                        ref={resumeInputRef}
                        style={styles.hiddenInput}
                        type="file"
                        accept=".pdf,.doc,.docx"
                        name="resume"
                        onChange={handleApplicationFileChange}
                      />
                      {applicationForm.resumeFileName ? (
                        <div style={styles.uploadFileRow}>
                          <div>
                            <p style={styles.uploadFileName}>{applicationForm.resumeFileName}</p>
                            <p style={styles.uploadStatus}>Resume attached successfully.</p>
                          </div>
                          <div style={styles.uploadActions}>
                            <button style={styles.btnInfo} type="button" onClick={() => openFilePicker('resume')}>Replace</button>
                            <button style={styles.btnDanger} type="button" onClick={() => clearApplicationFile('resume')}>Remove</button>
                          </div>
                        </div>
                      ) : (
                        <div style={styles.uploadEmptyState}>
                          <p style={styles.uploadStatus}>No resume selected yet.</p>
                          <button style={styles.btnPrimary} type="button" onClick={() => openFilePicker('resume')}>Choose Resume File</button>
                        </div>
                      )}
                    </div>

                    <div style={styles.uploadCard}>
                      <div style={styles.uploadHeader}>
                        <div>
                          <label style={styles.label}>CV file</label>
                          <p style={styles.uploadHelp}>Add a separate CV if you want to include academic or detailed project history.</p>
                        </div>
                        <span style={styles.uploadOptional}>Optional</span>
                      </div>
                      <input
                        ref={cvInputRef}
                        style={styles.hiddenInput}
                        type="file"
                        accept=".pdf,.doc,.docx"
                        name="cv"
                        onChange={handleApplicationFileChange}
                      />
                      {applicationForm.cvFileName ? (
                        <div style={styles.uploadFileRow}>
                          <div>
                            <p style={styles.uploadFileName}>{applicationForm.cvFileName}</p>
                            <p style={styles.uploadStatus}>CV attached successfully.</p>
                          </div>
                          <div style={styles.uploadActions}>
                            <button style={styles.btnInfo} type="button" onClick={() => openFilePicker('cv')}>Replace</button>
                            <button style={styles.btnDanger} type="button" onClick={() => clearApplicationFile('cv')}>Remove</button>
                          </div>
                        </div>
                      ) : (
                        <div style={styles.uploadEmptyState}>
                          <p style={styles.uploadStatus}>Add CV only if you want to share more detail.</p>
                          <button style={styles.btnSecondary} type="button" onClick={() => openFilePicker('cv')}>Choose CV File</button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={styles.applyTips}>
                    <span style={styles.applyTip}>At least one file is required before submitting.</span>
                    <span style={styles.applyTip}>Recruiters will be able to download the exact files you upload here.</span>
                  </div>
                  <button style={styles.btnSubmit} type="submit" disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit Application'}
                  </button>
                </form>
              </div>
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

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function formatDateTime(value) {
  if (!value) return 'Not scheduled yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function formatCountdown(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function guessLeetCodeLink(question) {
  const normalized = (question || '').toLowerCase();
  if (normalized.includes('two sum')) return 'https://leetcode.com/problems/two-sum/';
  if (normalized.includes('group anagrams')) return 'https://leetcode.com/problems/group-anagrams/';
  if (normalized.includes('linked list cycle')) return 'https://leetcode.com/problems/linked-list-cycle/';
  if (normalized.includes('merge intervals')) return 'https://leetcode.com/problems/merge-intervals/';
  if (normalized.includes('number of islands')) return 'https://leetcode.com/problems/number-of-islands/';
  return null;
}

function getToastStyle(type) {
  if (type === 'error') return { ...styles.toast, ...styles.toastError };
  if (type === 'warning') return { ...styles.toast, ...styles.toastWarning };
  if (type === 'info') return { ...styles.toast, ...styles.toastInfo };
  return { ...styles.toast, ...styles.toastSuccess };
}

function getQuestionNavStyle(index, currentIndex, answer) {
  if (index === currentIndex) return { ...styles.questionNavBtn, ...styles.questionNavBtnActive };
  if (answer?.trim()) return { ...styles.questionNavBtn, ...styles.questionNavBtnAnswered };
  return styles.questionNavBtn;
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
        ? 'Recruiter marked this application as hired.'
        : application?.status === 'REJECTED'
          ? 'Recruiter closed this application as rejected.'
          : application?.status === 'SHORTLISTED'
            ? 'Recruiter shortlisted this application for the next stage.'
            : 'Application submitted by candidate.',
    },
  ];
}

function getStatusLogMessage(entry) {
  if (entry?.message) return entry.message;
  if (entry?.status === 'HIRED') return 'Recruiter marked this application as hired.';
  if (entry?.status === 'REJECTED') return 'Recruiter closed this application as rejected.';
  if (entry?.status === 'SHORTLISTED') return 'Recruiter shortlisted this application for the next stage.';
  return 'Application submitted by candidate.';
}

const styles = {
  container: { minHeight: '100vh', background: 'linear-gradient(180deg, #ebe8df 0%, #f6f3ec 100%)' },
  shell: { display: 'grid', gridTemplateColumns: '300px minmax(0, 1fr)', minHeight: '100vh' },
  sidebar: { display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '28px 22px', background: '#111827', color: '#fff', borderRight: '1px solid rgba(255,255,255,0.08)', position: 'sticky', top: 0, height: '100vh' },
  brandBlock: { padding: '10px 10px 22px', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  logo: { fontFamily: 'Georgia, serif', fontSize: '28px', color: '#ffffff', marginBottom: '12px' },
  accent: { color: '#2563eb' },
  brandText: { fontSize: '13px', lineHeight: '1.7', color: 'rgba(255,255,255,0.68)' },
  sidebarGroup: { marginTop: '24px' },
  sidebarHeading: { padding: '0 10px', marginBottom: '10px', fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.52)' },
  sidebarTabs: { display: 'flex', flexDirection: 'column', gap: '8px' },
  sidebarTab: { display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left', padding: '14px 14px', borderRadius: '16px', border: '1px solid transparent', background: 'transparent', color: '#e5e7eb' },
  sidebarTabActive: { display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left', padding: '14px 14px', borderRadius: '16px', border: '1px solid rgba(96, 165, 250, 0.24)', background: 'linear-gradient(135deg, rgba(37,99,235,0.28) 0%, rgba(59,130,246,0.12) 100%)', color: '#ffffff', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' },
  sidebarTabLabel: { fontSize: '15px', fontWeight: '600' },
  sidebarTabHint: { fontSize: '12px', lineHeight: '1.5', color: 'rgba(255,255,255,0.68)' },
  sidebarFooter: { display: 'flex', flexDirection: 'column', gap: '12px' },
  sidebarProfileCard: { padding: '16px', borderRadius: '18px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' },
  sidebarIdentityRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  sidebarAvatarImage: { width: '50px', height: '50px', borderRadius: '16px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.18)' },
  sidebarAvatarFallback: { width: '50px', height: '50px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #2563eb 0%, #38bdf8 100%)', color: '#fff', fontSize: '16px', fontWeight: '700' },
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
  profileTriggerFallback: { width: '42px', height: '42px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)', color: '#fff', fontSize: '14px', fontWeight: '700' },
  profileTriggerText: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, flex: 1 },
  profileTriggerName: { fontSize: '13px', fontWeight: '700', color: '#111827', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  profileTriggerMeta: { fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' },
  profileChevron: { fontSize: '12px', color: '#6b7280' },
  profileDropdown: { position: 'absolute', top: 'calc(100% + 10px)', right: 0, zIndex: 80, width: '280px', padding: '16px', borderRadius: '20px', background: '#ffffff', border: '1px solid #ece8e1', boxShadow: '0 24px 48px rgba(15, 23, 42, 0.14)' },
  profileDropdownHeader: { display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '14px', marginBottom: '12px', borderBottom: '1px solid #f1efea' },
  dropdownAvatarImage: { width: '52px', height: '52px', borderRadius: '16px', objectFit: 'cover' },
  dropdownAvatarFallback: { width: '52px', height: '52px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #2563eb 0%, #38bdf8 100%)', color: '#fff', fontWeight: '700', fontSize: '16px' },
  dropdownName: { display: 'block', fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '4px' },
  dropdownEmail: { fontSize: '12px', lineHeight: '1.6', color: '#6b7280' },
  dropdownAction: { width: '100%', textAlign: 'left', padding: '11px 12px', borderRadius: '12px', border: 'none', background: '#f8fafc', color: '#111827', fontSize: '13px', fontWeight: '600', marginBottom: '8px' },
  dropdownLogout: { width: '100%', textAlign: 'left', padding: '11px 12px', borderRadius: '12px', border: '1px solid #fecaca', background: '#fff5f5', color: '#dc2626', fontSize: '13px', fontWeight: '700' },
  selectLabel: { display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', fontWeight: '600', color: '#4b5563' },
  sectionSelect: { minWidth: '220px', padding: '12px 14px', borderRadius: '14px', border: '1px solid #d6d3d1', background: '#ffffff', fontSize: '14px', color: '#111827', boxShadow: '0 6px 18px rgba(15, 23, 42, 0.06)' },
  msg: { background: '#dcfce7', color: '#166534', padding: '14px 18px', fontSize: '14px', borderRadius: '16px', border: '1px solid #bbf7d0', marginBottom: '18px' },
  content: { minWidth: 0 },
  heroCard: { display: 'flex', justifyContent: 'space-between', gap: '24px', alignItems: 'stretch', padding: '28px 32px', marginBottom: '28px', background: 'linear-gradient(135deg, #1f2937 0%, #111827 55%, #2563eb 100%)', color: '#fff', borderRadius: '24px', boxShadow: '0 22px 44px rgba(15, 23, 42, 0.18)' },
  heroEyebrow: { fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.18em', opacity: 0.72, marginBottom: '12px' },
  heroTitle: { fontFamily: 'Georgia, serif', fontSize: '34px', lineHeight: '1.1', marginBottom: '12px' },
  heroText: { maxWidth: '560px', fontSize: '15px', lineHeight: '1.7', color: 'rgba(255,255,255,0.82)' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(120px, 1fr))', gap: '12px', minWidth: '280px' },
  statCard: { display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '18px', borderRadius: '18px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)' },
  statLabel: { fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.72)' },
  statValue: { fontSize: '28px', fontWeight: '700', marginTop: '10px' },
  pageTitle: { fontFamily: 'Georgia, serif', fontSize: '36px', color: '#1a1a1a', marginBottom: '24px', letterSpacing: '-1px' },
  sectionText: { fontSize: '14px', color: '#5f5f5f', maxWidth: '760px', lineHeight: '1.7', marginBottom: '20px' },
  filterRow: { display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '22px' },
  search: { width: '100%', maxWidth: '400px', padding: '11px 16px', border: '1.5px solid #e2e1dd', borderRadius: '9px', fontSize: '14px', background: '#fff' },
  filterSelect: { minWidth: '180px', padding: '11px 14px', border: '1.5px solid #e2e1dd', borderRadius: '10px', fontSize: '14px', background: '#fff', color: '#111827' },
  countPill: { display: 'inline-flex', alignItems: 'center', padding: '10px 14px', borderRadius: '999px', background: '#eef2ff', color: '#3730a3', fontSize: '13px', fontWeight: '700' },
  jobsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '16px' },
  jobCard: { background: '#fff', border: '1px solid #e2e1dd', borderRadius: '12px', padding: '24px' },
  jobHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '12px' },
  jobTitle: { fontSize: '16px', fontWeight: '600', color: '#1a1a1a', marginBottom: '4px' },
  jobCompany: { fontSize: '13px', color: '#6b6b6b' },
  jobType: { padding: '4px 10px', background: '#eff4ff', color: '#2563eb', borderRadius: '100px', fontSize: '11px', fontWeight: '500' },
  jobDesc: { fontSize: '14px', color: '#6b6b6b', lineHeight: '1.6', marginBottom: '12px' },
  skills: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' },
  skill: { padding: '3px 10px', background: '#f0efeb', borderRadius: '100px', fontSize: '12px', color: '#1a1a1a' },
  jobFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e1dd', paddingTop: '16px', gap: '12px' },
  salary: { fontSize: '14px', fontWeight: '500', color: '#1a1a1a' },
  jobActions: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  btnPrimary: { padding: '8px 16px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500' },
  btnSecondary: { padding: '8px 16px', background: 'transparent', color: '#1a1a1a', border: '1px solid #e2e1dd', borderRadius: '8px', fontSize: '13px' },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  listCard: { background: '#fff', border: '1px solid #e2e1dd', borderRadius: '12px', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' },
  mockListCard: { background: '#fff', border: '1px solid #d6d3d1', borderRadius: '18px', padding: '22px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', boxShadow: '0 18px 36px rgba(15, 23, 42, 0.06)' },
  offerCard: { background: '#fff', border: '1px solid #d1fae5', borderRadius: '12px', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' },
  historyStatsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px' },
  historySummaryCard: { padding: '18px', borderRadius: '18px', background: '#ffffff', border: '1px solid #e7e5e4', boxShadow: '0 16px 34px rgba(15, 23, 42, 0.05)' },
  historySummaryLabel: { display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#64748b', marginBottom: '10px' },
  historySummaryValue: { fontSize: '28px', fontWeight: '800', color: '#111827' },
  historyCardPositive: { background: '#ffffff', border: '1px solid #bbf7d0', borderRadius: '18px', padding: '22px 24px', boxShadow: '0 18px 36px rgba(34, 197, 94, 0.08)' },
  historyCardNegative: { background: '#ffffff', border: '1px solid #fecaca', borderRadius: '18px', padding: '22px 24px', boxShadow: '0 18px 36px rgba(239, 68, 68, 0.08)' },
  historyCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '6px' },
  listTitle: { fontSize: '15px', fontWeight: '600', color: '#1a1a1a', marginBottom: '4px' },
  listSub: { fontSize: '13px', color: '#6b6b6b', marginBottom: '4px' },
  listDate: { fontSize: '12px', color: '#aaa' },
  fileLinks: { display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '10px' },
  timelineDetails: { marginTop: '14px', borderTop: '1px solid #ece8e1', paddingTop: '14px' },
  timelineSummary: { cursor: 'pointer', fontSize: '13px', fontWeight: '700', color: '#1d4ed8' },
  timelineList: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '14px' },
  timelineItem: { display: 'flex', gap: '12px', alignItems: 'flex-start' },
  timelineDot: { width: '10px', height: '10px', borderRadius: '999px', background: '#2563eb', marginTop: '10px', flexShrink: 0 },
  timelineBody: { flex: 1, minWidth: 0, padding: '14px 16px', borderRadius: '14px', background: '#fafaf9', border: '1px solid #ece8e1' },
  timelineHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' },
  timelineTime: { fontSize: '12px', color: '#64748b', fontWeight: '600' },
  timelineMessage: { fontSize: '13px', color: '#4b5563', lineHeight: '1.7' },
  mockMetaRow: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' },
  metaPill: { display: 'inline-flex', alignItems: 'center', padding: '6px 10px', borderRadius: '999px', background: '#eef2ff', color: '#4338ca', fontSize: '12px', fontWeight: '600' },
  status: { padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: '500' },
  statusSuccess: { padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: '500', background: '#dcfce7', color: '#16a34a' },
  statusInfo: { padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: '500', background: '#eff4ff', color: '#2563eb' },
  hiredBadge: { padding: '6px 14px', borderRadius: '100px', fontSize: '12px', fontWeight: '700', background: '#dcfce7', color: '#166534' },
  score: { fontSize: '13px', color: '#16a34a', marginTop: '4px' },
  evaluationCard: { marginTop: '14px', padding: '14px 16px', borderRadius: '16px', background: '#f8fafc', border: '1px solid #dbeafe' },
  evaluationHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' },
  evaluationScore: { fontSize: '14px', fontWeight: '800', color: '#166534' },
  evaluationMeta: { fontSize: '12px', color: '#475569', fontWeight: '600' },
  evaluationSummary: { fontSize: '13px', color: '#475569', lineHeight: '1.7', marginTop: '8px' },
  inlineLink: { display: 'inline-block', marginTop: '10px', color: '#2563eb', fontSize: '13px', fontWeight: '600' },
  note: { fontSize: '12px', color: '#6b6b6b', marginTop: '8px' },
  interviewActions: { display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' },
  answersDetails: { marginTop: '12px', borderTop: '1px solid #dbeafe', paddingTop: '12px' },
  answersSummary: { cursor: 'pointer', fontSize: '13px', fontWeight: '700', color: '#1d4ed8' },
  evaluationDetails: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '14px' },
  evaluationListTitle: { fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#64748b', marginBottom: '8px' },
  evaluationChipWrap: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  positiveChip: { display: 'inline-flex', alignItems: 'center', padding: '8px 10px', borderRadius: '999px', background: '#dcfce7', color: '#166534', fontSize: '12px', fontWeight: '600' },
  warningChip: { display: 'inline-flex', alignItems: 'center', padding: '8px 10px', borderRadius: '999px', background: '#fff7ed', color: '#c2410c', fontSize: '12px', fontWeight: '600' },
  empty: { color: '#6b6b6b', fontSize: '15px' },
  formContainer: { maxWidth: '760px' },
  form: { background: '#fff', border: '1px solid #e2e1dd', borderRadius: '16px', padding: '32px' },
  profileHero: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #e2e1dd' },
  profileName: { fontSize: '24px', fontWeight: '600', color: '#1a1a1a', marginBottom: '6px' },
  profileSub: { fontSize: '14px', color: '#6b6b6b', maxWidth: '460px' },
  rolePill: { padding: '6px 12px', background: '#eff4ff', color: '#2563eb', borderRadius: '100px', fontSize: '12px', fontWeight: '600' },
  profileMediaCard: { marginBottom: '22px', padding: '18px', borderRadius: '20px', border: '1px solid #ece8e1', background: '#fcfcfb' },
  profileMediaRow: { display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '16px' },
  profileAvatarLargeImage: { width: '84px', height: '84px', borderRadius: '24px', objectFit: 'cover', boxShadow: '0 12px 28px rgba(15, 23, 42, 0.12)' },
  profileAvatarLargeFallback: { width: '84px', height: '84px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)', color: '#fff', fontWeight: '700', fontSize: '24px', boxShadow: '0 12px 28px rgba(15, 23, 42, 0.12)' },
  profileMediaText: { flex: 1 },
  mediaTitle: { fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '6px' },
  mediaSub: { fontSize: '13px', lineHeight: '1.7', color: '#6b7280', maxWidth: '420px' },
  profileMediaActions: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  uploadPanel: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' },
  uploadCard: { padding: '18px', borderRadius: '18px', border: '1px solid #e7e5e4', background: '#fcfcfb' },
  uploadHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' },
  uploadHelp: { fontSize: '12px', lineHeight: '1.6', color: '#6b7280', marginTop: '6px', maxWidth: '280px' },
  uploadRequired: { padding: '6px 10px', borderRadius: '999px', background: '#dbeafe', color: '#1d4ed8', fontSize: '11px', fontWeight: '700' },
  uploadOptional: { padding: '6px 10px', borderRadius: '999px', background: '#f3f4f6', color: '#4b5563', fontSize: '11px', fontWeight: '700' },
  hiddenInput: { display: 'none' },
  uploadEmptyState: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px', padding: '8px 0 2px' },
  uploadFileRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', padding: '10px 0 2px' },
  uploadFileName: { fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '6px' },
  uploadStatus: { fontSize: '12px', lineHeight: '1.6', color: '#6b7280' },
  uploadActions: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  applyTips: { display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' },
  applyTip: { display: 'inline-flex', alignItems: 'center', padding: '8px 12px', borderRadius: '999px', background: '#f3f4f6', color: '#4b5563', fontSize: '12px', fontWeight: '600' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  field: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' },
  input: { width: '100%', padding: '11px 14px', border: '1.5px solid #e2e1dd', borderRadius: '9px', fontSize: '14px', background: '#fff' },
  inputDisabled: { width: '100%', padding: '11px 14px', border: '1.5px solid #ece8e1', borderRadius: '9px', fontSize: '14px', background: '#f8f7f3', color: '#6b6b6b' },
  textarea: { width: '100%', minHeight: '120px', padding: '11px 14px', border: '1.5px solid #e2e1dd', borderRadius: '9px', fontSize: '14px', background: '#fff', resize: 'vertical' },
  btnSubmit: { width: '100%', padding: '13px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: '9px', fontSize: '15px', fontWeight: '500', marginTop: '8px' },
  btnInfo: { padding: '8px 16px', background: '#dbeafe', color: '#1d4ed8', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500' },
  btnDanger: { padding: '8px 16px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500' },
  mockPanel: { marginTop: '24px', background: '#fff', border: '1px solid #e2e1dd', borderRadius: '16px', padding: '24px' },
  applicationModalBackdrop: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '28px', zIndex: 250 },
  applicationModal: { width: 'min(920px, 100%)', maxHeight: 'calc(100vh - 56px)', overflowY: 'auto', background: '#fff', border: '1px solid #e7e5e4', borderRadius: '24px', padding: '28px', boxShadow: '0 30px 70px rgba(15, 23, 42, 0.25)' },
  modalCloseBtn: { padding: '10px 14px', border: '1px solid #e2e1dd', borderRadius: '12px', background: '#fff', color: '#111827', fontSize: '13px', fontWeight: '700' },
  question: { fontSize: '14px', color: '#1a1a1a', marginBottom: '10px', lineHeight: '1.6' },
  mockTestShell: { marginTop: '26px', display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr)', gap: '18px', alignItems: 'start' },
  mockSidebar: { display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '24px' },
  mockSidebarCard: { background: '#fff', border: '1px solid #e7e5e4', borderRadius: '20px', padding: '20px', boxShadow: '0 18px 36px rgba(15, 23, 42, 0.06)' },
  mockSidebarLabel: { fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#6b7280', marginBottom: '10px' },
  timerCard: { marginTop: '18px', padding: '16px', borderRadius: '18px', background: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)', color: '#fff' },
  timerLabel: { display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.78 },
  timerValue: { display: 'block', fontSize: '36px', fontWeight: '700', margin: '10px 0 6px' },
  timerHint: { display: 'block', fontSize: '12px', lineHeight: '1.6', color: 'rgba(255,255,255,0.75)' },
  progressCard: { marginTop: '16px' },
  progressHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  progressLabel: { fontSize: '12px', color: '#6b7280', fontWeight: '600' },
  progressValue: { fontSize: '13px', color: '#111827', fontWeight: '700' },
  progressTrack: { width: '100%', height: '10px', borderRadius: '999px', background: '#e5e7eb', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: '999px', background: 'linear-gradient(90deg, #2563eb 0%, #38bdf8 100%)' },
  questionNavGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '10px' },
  questionNavBtn: { width: '100%', aspectRatio: '1 / 1', borderRadius: '14px', border: '1px solid #d6d3d1', background: '#fafaf9', color: '#111827', fontSize: '13px', fontWeight: '700' },
  questionNavBtnActive: { borderColor: '#2563eb', background: '#dbeafe', color: '#1d4ed8' },
  questionNavBtnAnswered: { borderColor: '#16a34a', background: '#dcfce7', color: '#166534' },
  mockMain: { minWidth: 0 },
  mockQuestionCard: { background: '#fff', border: '1px solid #e7e5e4', borderRadius: '22px', padding: '24px', boxShadow: '0 18px 36px rgba(15, 23, 42, 0.06)' },
  mockQuestionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '18px' },
  practiceLink: { display: 'inline-flex', alignItems: 'center', padding: '10px 14px', borderRadius: '999px', background: '#fff7ed', color: '#c2410c', fontSize: '13px', fontWeight: '700', marginBottom: '18px', border: '1px solid #fdba74' },
  mockTextarea: { width: '100%', minHeight: '320px', padding: '16px 18px', border: '1.5px solid #d6d3d1', borderRadius: '18px', fontSize: '14px', background: '#fcfcfb', resize: 'vertical', lineHeight: '1.7' },
  mockFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginTop: '18px' },
  mockFooterActions: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  btnSubmitInline: { padding: '12px 18px', background: '#111827', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700' },
};
