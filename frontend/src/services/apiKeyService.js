import api from './api';

export const getApiKeys = () =>
  api.get('/keys').then((res) => res.data);

export const createApiKey = (data) =>
  api.post('/keys', data).then((res) => res.data);

export const deleteApiKey = (id) =>
  api.delete(`/keys/${id}`).then((res) => res.data);
