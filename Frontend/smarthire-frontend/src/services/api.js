import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
};

export const jobsAPI = {
    getAllJobs: () => api.get('/jobs/all'),
    getJobById: (id) => api.get(`/jobs/${id}`),
    createJob: (data) => api.post('/jobs/create', data),
    searchJobs: (keyword) => api.get(`/jobs/search/${keyword}`),
    deleteJob: (id) => api.delete(`/jobs/${id}`),
};

export const interviewAPI = {
    scheduleInterview: (data) => api.post('/interviews/schedule', data),
    getInterviewById: (id) => api.get(`/interviews/${id}`),
    getInterviewsByCandidate: (email) => api.get(`/interviews/candidate/${email}`),
    completeInterview: (id, answers) => api.post(`/interviews/complete/${id}`, answers),
};

export const applicationAPI = {
    applyForJob: (data) => api.post('/applications/apply', data),
    getApplicationsByCandidate: (email) => api.get(`/applications/candidate/${email}`),
    getApplicationsByJob: (jobId) => api.get(`/applications/job/${jobId}`),
    updateStatus: (id, status) => api.put(`/applications/status/${id}?status=${status}`),
};

export default api;