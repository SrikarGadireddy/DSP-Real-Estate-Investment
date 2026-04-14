import api from './api';

export const getProperties = (params = {}) =>
  api.get('/properties', { params }).then((res) => res.data);

export const getProperty = (id) =>
  api.get(`/properties/${id}`).then((res) => res.data);

export const createProperty = (data) =>
  api.post('/properties', data).then((res) => res.data);

export const updateProperty = (id, data) =>
  api.put(`/properties/${id}`, data).then((res) => res.data);

export const deleteProperty = (id) =>
  api.delete(`/properties/${id}`).then((res) => res.data);
