import api from './api';

const brochureService = {
  list() {
    return api.get('/brochures');
  },

  get(id) {
    return api.get(`/brochures/${id}`);
  },

  upload(file, onUploadProgress) {
    const formData = new FormData();
    formData.append('brochure', file);
    return api.post('/brochures/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
  },

  createProperty(id, overrides = {}) {
    return api.post(`/brochures/${id}/create-property`, overrides);
  },

  delete(id) {
    return api.delete(`/brochures/${id}`);
  },
};

export default brochureService;
