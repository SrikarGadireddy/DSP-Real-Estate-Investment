import api from './api';

export const searchProperties = (params = {}) =>
  api.get('/search', { params }).then((res) => res.data);

export const getSavedSearches = () =>
  api.get('/search/saved').then((res) => res.data);

export const saveSearch = (data) =>
  api.post('/search/saved', data).then((res) => res.data);

export const deleteSavedSearch = (id) =>
  api.delete(`/search/saved/${id}`).then((res) => res.data);
