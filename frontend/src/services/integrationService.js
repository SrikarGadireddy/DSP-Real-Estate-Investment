import api from './api';

export const getIntegrations = () =>
  api.get('/integrations').then((res) => res.data);

export const getIntegration = (id) =>
  api.get(`/integrations/${id}`).then((res) => res.data);

export const connectIntegration = (id, config) =>
  api.post(`/integrations/${id}/connect`, config).then((res) => res.data);

export const disconnectIntegration = (id) =>
  api.post(`/integrations/${id}/disconnect`).then((res) => res.data);

export const getMyConnections = () =>
  api.get('/integrations/connections/me').then((res) => res.data);
