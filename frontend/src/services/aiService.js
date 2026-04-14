import api from './api';

const aiService = {
  status() {
    return api.get('/ai/status');
  },

  chat(message, history = []) {
    return api.post('/ai/chat', { message, history });
  },

  analyzeProperty(id) {
    return api.get(`/ai/analyze-property/${id}`);
  },

  generateDescription(propertyData) {
    return api.post('/ai/generate-description', { property_data: propertyData });
  },

  investmentAdvice({ budget, goals, risk_tolerance, preferred_types }) {
    return api.post('/ai/investment-advice', { budget, goals, risk_tolerance, preferred_types });
  },
};

export default aiService;
