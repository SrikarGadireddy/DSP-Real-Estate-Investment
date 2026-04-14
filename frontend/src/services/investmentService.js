import api from './api';

export const getInvestments = (params = {}) =>
  api.get('/investments', { params }).then((res) => res.data);

export const getInvestment = (id) =>
  api.get(`/investments/${id}`).then((res) => res.data);

export const createInvestment = (data) =>
  api.post('/investments', data).then((res) => res.data);

export const updateInvestment = (id, data) =>
  api.put(`/investments/${id}`, data).then((res) => res.data);

export const deleteInvestment = (id) =>
  api.delete(`/investments/${id}`).then((res) => res.data);
