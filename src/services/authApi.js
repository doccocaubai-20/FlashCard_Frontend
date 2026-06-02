import api from './api';

export const authApi = {
    register: (data) => api.post('/api/auth/register', data),
    login: (data) => api.post('/api/auth/login', data),
    googleLogin: (data) => api.post('/api/auth/google', data),
    getMe: () => api.get('/api/users/me'),
    updateUser: (id, data) => api.patch(`/api/users/${id}`, data),
};