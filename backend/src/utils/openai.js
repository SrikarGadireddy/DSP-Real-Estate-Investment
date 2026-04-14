const OpenAI = require('openai');

let _client = null;

function isAIEnabled() {
  return Boolean(process.env.OPENAI_API_KEY);
}

function getOpenAIClient() {
  if (!isAIEnabled()) {
    throw new Error(
      'OpenAI API key is not configured. Set OPENAI_API_KEY in the environment.'
    );
  }
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

module.exports = { isAIEnabled, getOpenAIClient };
