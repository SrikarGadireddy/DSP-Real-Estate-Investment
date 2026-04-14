import { useState, useEffect } from 'react';
import { getApiKeys, createApiKey, deleteApiKey } from '../services/apiKeyService';
import LoadingSpinner from '../components/LoadingSpinner';

const PERMISSIONS = ['read:properties', 'write:properties', 'read:investments', 'write:investments', 'read:search', 'read:analytics'];

export default function ApiOnboarding() {
  const [activeTab, setActiveTab] = useState('overview');
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', permissions: [] });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [newKey, setNewKey] = useState(null);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const data = await getApiKeys();
      setKeys(Array.isArray(data) ? data : data.keys || data.data || []);
    } catch {
      setKeys([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = (perm) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      const data = await createApiKey(form);
      setNewKey(data.key || data.api_key || data);
      setShowCreate(false);
      setForm({ name: '', description: '', permissions: [] });
      await fetchKeys();
    } catch (err) {
      setFormError(err.response?.data?.message || err.response?.data?.error || 'Failed to create API key');
    } finally {
      setFormLoading(false);
    }
  };

  const handleRevoke = async (id) => {
    if (!window.confirm('Revoke this API key? This action cannot be undone.')) return;
    try {
      await deleteApiKey(id);
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } catch {
      /* ignore */
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'keys', label: 'API Keys' },
    { id: 'examples', label: 'Code Examples' },
    { id: 'guide', label: 'Auth Guide' },
  ];

  return (
    <div className="api-onboarding">
      <h1>API Developer Portal</h1>
      <p className="page-subtitle">
        Build integrations with the DSP Real Estate API
      </p>

      <div className="tab-nav">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-nav__item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="api-overview">
            <div className="api-overview__card">
              <h2>Getting Started</h2>
              <p>
                The DSP Real Estate API gives you programmatic access to properties,
                investments, search, and analytics data. Follow these steps:
              </p>
              <ol className="getting-started-steps">
                <li>
                  <strong>Create an API Key</strong> — Go to the API Keys tab and generate
                  a new key with the permissions you need.
                </li>
                <li>
                  <strong>Authenticate Requests</strong> — Include your API key in the
                  <code>Authorization</code> header as a Bearer token.
                </li>
                <li>
                  <strong>Make API Calls</strong> — Use the endpoints below to access data.
                </li>
              </ol>
            </div>

            <div className="api-overview__card">
              <h2>Available Endpoints</h2>
              <div className="endpoint-list">
                {[
                  { method: 'GET', path: '/api/properties', desc: 'List all properties' },
                  { method: 'GET', path: '/api/properties/:id', desc: 'Get property details' },
                  { method: 'POST', path: '/api/properties', desc: 'Create a property' },
                  { method: 'GET', path: '/api/investments', desc: 'List your investments' },
                  { method: 'POST', path: '/api/investments', desc: 'Create an investment' },
                  { method: 'GET', path: '/api/search', desc: 'Search properties' },
                  { method: 'GET', path: '/api/dashboard', desc: 'Portfolio summary' },
                  { method: 'GET', path: '/api/dashboard/analytics', desc: 'Investment analytics' },
                ].map((ep, i) => (
                  <div key={i} className="endpoint-item">
                    <span className={`endpoint-method endpoint-method--${ep.method.toLowerCase()}`}>
                      {ep.method}
                    </span>
                    <code className="endpoint-path">{ep.path}</code>
                    <span className="endpoint-desc">{ep.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="api-overview__card">
              <h2>Rate Limiting</h2>
              <p>
                API requests are rate-limited to ensure fair usage:
              </p>
              <ul>
                <li><strong>Free tier:</strong> 100 requests per minute</li>
                <li><strong>Pro tier:</strong> 1,000 requests per minute</li>
                <li><strong>Enterprise:</strong> Custom limits</li>
              </ul>
              <p>
                Rate limit headers (<code>X-RateLimit-Limit</code>,{' '}
                <code>X-RateLimit-Remaining</code>) are included in every response.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'keys' && (
          <div className="api-keys-section">
            <div className="page-header">
              <h2>Your API Keys</h2>
              <button className="btn btn--primary" onClick={() => { setShowCreate(true); setNewKey(null); }}>
                + Create New Key
              </button>
            </div>

            {newKey && (
              <div className="alert alert--success api-key-created">
                <strong>API Key Created!</strong>
                <p>Copy this key now — it won&apos;t be shown again.</p>
                <div className="api-key-display">
                  <code>{typeof newKey === 'string' ? newKey : newKey.key || newKey.api_key || JSON.stringify(newKey)}</code>
                  <button
                    className="btn btn--outline btn--sm"
                    onClick={() => copyToClipboard(typeof newKey === 'string' ? newKey : newKey.key || newKey.api_key)}
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
            )}

            {showCreate && (
              <div className="api-key-form-card">
                <h3>Create New API Key</h3>
                {formError && <div className="alert alert--error">{formError}</div>}
                <form onSubmit={handleCreate}>
                  <div className="form-group">
                    <label htmlFor="key-name">Key Name</label>
                    <input
                      type="text"
                      id="key-name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g., Production App"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="key-desc">Description</label>
                    <input
                      type="text"
                      id="key-desc"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="What will this key be used for?"
                    />
                  </div>
                  <div className="form-group">
                    <label>Permissions</label>
                    <div className="permissions-grid">
                      {PERMISSIONS.map((perm) => (
                        <label key={perm} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={form.permissions.includes(perm)}
                            onChange={() => handlePermissionToggle(perm)}
                          />
                          <span>{perm}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="modal__actions">
                    <button type="button" className="btn btn--outline" onClick={() => setShowCreate(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn--primary" disabled={formLoading}>
                      {formLoading ? 'Creating...' : 'Create Key'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {loading ? (
              <LoadingSpinner />
            ) : keys.length > 0 ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Key</th>
                      <th>Permissions</th>
                      <th>Created</th>
                      <th>Last Used</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keys.map((k) => (
                      <tr key={k.id}>
                        <td className="text-bold">{k.name || 'Unnamed'}</td>
                        <td>
                          <code className="api-key-masked">
                            {k.key_preview || k.key_prefix || '••••••••'}
                          </code>
                        </td>
                        <td>
                          <div className="permission-badges">
                            {(k.permissions || []).map((p, i) => (
                              <span key={i} className="badge badge--type badge--sm">{p}</span>
                            ))}
                          </div>
                        </td>
                        <td>{k.created_at ? new Date(k.created_at).toLocaleDateString() : 'N/A'}</td>
                        <td>{k.last_used ? new Date(k.last_used).toLocaleDateString() : 'Never'}</td>
                        <td>
                          <span className={`badge badge--${k.status === 'active' ? 'available' : 'revoked'}`}>
                            {k.status || 'active'}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn--danger btn--sm" onClick={() => handleRevoke(k.id)}>
                            Revoke
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <h3>No API keys yet</h3>
                <p>Create your first API key to start building integrations.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'examples' && (
          <div className="code-examples">
            <h2>Code Examples</h2>

            <div className="code-example">
              <h3>cURL</h3>
              <pre className="code-block">{`# List properties
curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://api.dsp-realestate.com/api/properties

# Search properties
curl -H "Authorization: Bearer YOUR_API_KEY" \\
  "https://api.dsp-realestate.com/api/search?city=Austin&min_price=200000"

# Create an investment
curl -X POST \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"property_id": 1, "amount": 50000}' \\
  https://api.dsp-realestate.com/api/investments`}</pre>
            </div>

            <div className="code-example">
              <h3>JavaScript (fetch)</h3>
              <pre className="code-block">{`const API_KEY = 'YOUR_API_KEY';
const BASE_URL = 'https://api.dsp-realestate.com/api';

// List properties
const response = await fetch(\`\${BASE_URL}/properties\`, {
  headers: { 'Authorization': \`Bearer \${API_KEY}\` }
});
const properties = await response.json();

// Create an investment
const investRes = await fetch(\`\${BASE_URL}/investments\`, {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${API_KEY}\`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    property_id: 1,
    amount: 50000
  })
});`}</pre>
            </div>

            <div className="code-example">
              <h3>Python (requests)</h3>
              <pre className="code-block">{`import requests

API_KEY = "YOUR_API_KEY"
BASE_URL = "https://api.dsp-realestate.com/api"
headers = {"Authorization": f"Bearer {API_KEY}"}

# List properties
response = requests.get(f"{BASE_URL}/properties", headers=headers)
properties = response.json()

# Search properties
params = {"city": "Austin", "min_price": 200000}
response = requests.get(
    f"{BASE_URL}/search", headers=headers, params=params
)

# Create an investment
investment = requests.post(
    f"{BASE_URL}/investments",
    headers=headers,
    json={"property_id": 1, "amount": 50000}
)`}</pre>
            </div>
          </div>
        )}

        {activeTab === 'guide' && (
          <div className="auth-guide">
            <h2>Authentication Guide</h2>

            <div className="api-overview__card">
              <h3>Bearer Token Authentication</h3>
              <p>
                All API requests must include an <code>Authorization</code> header
                with a valid Bearer token.
              </p>
              <pre className="code-block">{`Authorization: Bearer YOUR_API_KEY`}</pre>
            </div>

            <div className="api-overview__card">
              <h3>User Authentication (JWT)</h3>
              <p>
                For user-specific operations, authenticate with email and password
                to receive a JWT token:
              </p>
              <pre className="code-block">{`POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your_password"
}

// Response:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": 1, "email": "user@example.com" }
}`}</pre>
            </div>

            <div className="api-overview__card">
              <h3>Error Responses</h3>
              <p>The API returns standard HTTP status codes:</p>
              <ul>
                <li><strong>200</strong> — Success</li>
                <li><strong>201</strong> — Created</li>
                <li><strong>400</strong> — Bad Request (invalid parameters)</li>
                <li><strong>401</strong> — Unauthorized (missing or invalid token)</li>
                <li><strong>403</strong> — Forbidden (insufficient permissions)</li>
                <li><strong>404</strong> — Not Found</li>
                <li><strong>429</strong> — Rate Limit Exceeded</li>
                <li><strong>500</strong> — Internal Server Error</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
