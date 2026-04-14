import { useState, useEffect, useRef } from 'react';
import aiService from '../services/aiService';

export default function AiAssistant() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Hi! I\'m DSP Advisor, your AI real-estate investment assistant. I can help you with ' +
        'property analysis, investment strategies, ROI calculations, and navigating the platform. ' +
        'What would you like to know?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(null);
  const [activeTab, setActiveTab] = useState('chat');
  const [advice, setAdvice] = useState('');
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [adviceForm, setAdviceForm] = useState({
    budget: '',
    goals: '',
    risk_tolerance: 'medium',
    preferred_types: [],
  });
  const messagesEndRef = useRef(null);

  useEffect(() => {
    aiService.status().then(({ data }) => setAiEnabled(data.ai_enabled)).catch(() => setAiEnabled(false));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const history = messages.slice(1); // exclude the initial greeting
    const userMsg = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await aiService.chat(text, history);
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      const errMsg =
        err.response?.data?.error ||
        'Sorry, I encountered an error. Please check your OpenAI API key configuration.';
      setMessages((prev) => [...prev, { role: 'assistant', content: errMsg }]);
    } finally {
      setLoading(false);
    }
  }

  async function getInvestmentAdvice(e) {
    e.preventDefault();
    setAdviceLoading(true);
    setAdvice('');
    try {
      const { data } = await aiService.investmentAdvice(adviceForm);
      setAdvice(data.advice);
    } catch (err) {
      setAdvice(err.response?.data?.error || 'Failed to get advice. Check your OpenAI API key.');
    } finally {
      setAdviceLoading(false);
    }
  }

  function togglePropertyType(type) {
    setAdviceForm((prev) => {
      const types = prev.preferred_types.includes(type)
        ? prev.preferred_types.filter((t) => t !== type)
        : [...prev.preferred_types, type];
      return { ...prev, preferred_types: types };
    });
  }

  const PROPERTY_TYPES = ['residential', 'commercial', 'industrial', 'land', 'mixed-use'];

  const QUICK_PROMPTS = [
    'What is a good cap rate for residential properties?',
    'How do I calculate cash-on-cash return?',
    'What are the risks of commercial real estate investing?',
    'Explain the BRRRR strategy',
    'How does the 1% rule work in real estate?',
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">🤖 AI Real Estate Advisor</h1>
        <p className="page-subtitle">
          Powered by GPT-4o — ask anything about real estate investment, get personalized analysis,
          and make smarter decisions.
        </p>
      </div>

      {aiEnabled === false && (
        <div className="alert alert--warning">
          <strong>⚠️ AI features are not configured.</strong> Add your{' '}
          <code>OPENAI_API_KEY</code> to <code>backend/.env</code> and restart the server to
          enable AI capabilities.
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'chat' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          💬 Chat Assistant
        </button>
        <button
          className={`tab ${activeTab === 'advice' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('advice')}
        >
          📊 Investment Advice
        </button>
      </div>

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <div className="chat-container">
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-message chat-message--${msg.role}`}>
                <div className="chat-message__avatar">
                  {msg.role === 'assistant' ? '🤖' : '👤'}
                </div>
                <div className="chat-message__bubble">
                  {msg.content.split('\n').map((line, j) => (
                    <p key={j}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
            {loading && (
              <div className="chat-message chat-message--assistant">
                <div className="chat-message__avatar">🤖</div>
                <div className="chat-message__bubble chat-message__bubble--typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompts */}
          <div className="quick-prompts">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                className="quick-prompt"
                onClick={() => { setInput(p); }}
                disabled={loading}
              >
                {p}
              </button>
            ))}
          </div>

          <form className="chat-input-row" onSubmit={sendMessage}>
            <input
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about real estate investing…"
              disabled={loading}
            />
            <button className="btn btn--primary" type="submit" disabled={loading || !input.trim()}>
              {loading ? '…' : 'Send'}
            </button>
          </form>
        </div>
      )}

      {/* Investment Advice Tab */}
      {activeTab === 'advice' && (
        <div className="advice-container">
          <form className="advice-form card" onSubmit={getInvestmentAdvice}>
            <h3>Tell us about your investment goals</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Available Budget ($)</label>
                <input
                  className="form-control"
                  type="number"
                  placeholder="e.g. 250000"
                  value={adviceForm.budget}
                  onChange={(e) => setAdviceForm((p) => ({ ...p, budget: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Risk Tolerance</label>
                <select
                  className="form-control"
                  value={adviceForm.risk_tolerance}
                  onChange={(e) => setAdviceForm((p) => ({ ...p, risk_tolerance: e.target.value }))}
                >
                  <option value="low">Low — Capital preservation</option>
                  <option value="medium">Medium — Balanced growth</option>
                  <option value="high">High — Maximum returns</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Investment Goals</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="e.g. Build passive income, grow wealth for retirement, flip properties…"
                value={adviceForm.goals}
                onChange={(e) => setAdviceForm((p) => ({ ...p, goals: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label>Preferred Property Types</label>
              <div className="tag-group">
                {PROPERTY_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`tag ${adviceForm.preferred_types.includes(type) ? 'tag--active' : ''}`}
                    onClick={() => togglePropertyType(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="btn btn--primary"
              type="submit"
              disabled={adviceLoading}
            >
              {adviceLoading ? 'Generating advice…' : '🤖 Get Personalized Advice'}
            </button>
          </form>

          {adviceLoading && (
            <div className="loading-state">
              <div className="spinner" />
              <p>Analyzing your portfolio and generating personalized advice…</p>
            </div>
          )}

          {advice && (
            <div className="advice-result card">
              <h3>📊 Your Personalized Investment Advice</h3>
              <div className="advice-content">
                {advice.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
