import api from './api';

export const getDashboardSummary = () =>
  api.get('/dashboard').then((res) => res.data);

export const getDashboardAnalytics = () =>
  api.get('/dashboard/analytics').then((res) => res.data);
