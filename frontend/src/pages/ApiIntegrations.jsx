import { useState, useEffect } from 'react';
import {
  getIntegrations,
  connectIntegration,
  disconnectIntegration,
  getMyConnections,
} from '../services/integrationService';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ApiIntegrations() {
  const [integrations, setIntegrations] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [configModal, setConfigModal] = useState(null);
  const [configValues, setConfigValues] = useState({});
  const [actionLoading, setActionLoading] = useState(null);
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [intData, connData] = await Promise.all([
          getIntegrations().catch(() => []),
          getMyConnections().catch(() => []),
        ]);
        setIntegrations(Array.isArray(intData) ? intData : intData.integrations || intData.data || []);
        setConnections(Array.isArray(connData) ? connData : connData.connections || connData.data || []);
      } catch {
        setError('Failed to load integrations');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const isConnected = (integrationId) =>
    connections.some((c) => c.integration_id === integrationId || c.id === integrationId);

  const handleConnect = async (integration) => {
    const template = integration.config_template || integration.configTemplate;
    if (template && Object.keys(template).length > 0) {
      setConfigModal(integration);
      const initial = {};
      Object.keys(template).forEach((k) => {
        initial[k] = '';
      });
      setConfigValues(initial);
      return;
    }
    setActionLoading(integration.id);
    setActionMsg('');
    try {
      await connectIntegration(integration.id, {});
      const connData = await getMyConnections();
      setConnections(Array.isArray(connData) ? connData : connData.connections || connData.data || []);
      setActionMsg(`Connected to ${integration.name}!`);
    } catch (err) {
      setActionMsg(err.response?.data?.message || 'Connection failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfigSubmit = async (e) => {
    e.preventDefault();
    if (!configModal) return;
    setActionLoading(configModal.id);
    setActionMsg('');
    try {
      await connectIntegration(configModal.id, configValues);
      const connData = await getMyConnections();
      setConnections(Array.isArray(connData) ? connData : connData.connections || connData.data || []);
      setActionMsg(`Connected to ${configModal.name}!`);
      setConfigModal(null);
    } catch (err) {
      setActionMsg(err.response?.data?.message || 'Connection failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisconnect = async (integration) => {
    if (!window.confirm(`Disconnect from ${integration.name}?`)) return;
    setActionLoading(integration.id);
    setActionMsg('');
    try {
      await disconnectIntegration(integration.id);
      setConnections((prev) =>
        prev.filter((c) => c.integration_id !== integration.id && c.id !== integration.id)
      );
      setActionMsg(`Disconnected from ${integration.name}`);
    } catch (err) {
      setActionMsg(err.response?.data?.message || 'Disconnect failed');
    } finally {
      setActionLoading(null);
    }
  };

  const categories = [...new Set(integrations.map((i) => i.category || 'Other'))];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="integrations-page">
      <h1>API Integrations</h1>
      <p className="page-subtitle">
        Connect third-party services to enhance your real estate platform.
      </p>

      {error && <div className="alert alert--error">{error}</div>}
      {actionMsg && (
        <div className={`alert ${actionMsg.includes('fail') || actionMsg.includes('Failed') ? 'alert--error' : 'alert--success'}`}>
          {actionMsg}
        </div>
      )}

      {connections.length > 0 && (
        <section className="integrations-section">
          <h2>Active Connections</h2>
          <div className="integrations-grid">
            {connections.map((conn) => {
              const integration = integrations.find(
                (i) => i.id === conn.integration_id || i.id === conn.id
              ) || conn;
              return (
                <div key={conn.id || conn.integration_id} className="integration-card integration-card--connected">
                  <div className="integration-card__header">
                    <h3>{integration.name || conn.name}</h3>
                    <span className="badge badge--available">Connected</span>
                  </div>
                  <p>{integration.description || conn.description || ''}</p>
                  <div className="integration-card__actions">
                    <button
                      className="btn btn--danger btn--sm"
                      onClick={() => handleDisconnect(integration)}
                      disabled={actionLoading === integration.id}
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {categories.map((category) => (
        <section key={category} className="integrations-section">
          <h2>{category}</h2>
          <div className="integrations-grid">
            {integrations
              .filter((i) => (i.category || 'Other') === category)
              .map((integration) => {
                const connected = isConnected(integration.id);
                return (
                  <div
                    key={integration.id}
                    className={`integration-card ${connected ? 'integration-card--connected' : ''}`}
                  >
                    <div className="integration-card__header">
                      <h3>{integration.name}</h3>
                      <span className="badge badge--type">{integration.category || 'Other'}</span>
                    </div>
                    <p>{integration.description}</p>
                    {integration.documentation_url && (
                      <a
                        href={integration.documentation_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="integration-card__docs"
                      >
                        📖 Documentation
                      </a>
                    )}
                    <div className="integration-card__actions">
                      {connected ? (
                        <button
                          className="btn btn--danger btn--sm"
                          onClick={() => handleDisconnect(integration)}
                          disabled={actionLoading === integration.id}
                        >
                          {actionLoading === integration.id ? 'Processing...' : 'Disconnect'}
                        </button>
                      ) : (
                        <button
                          className="btn btn--primary btn--sm"
                          onClick={() => handleConnect(integration)}
                          disabled={actionLoading === integration.id}
                        >
                          {actionLoading === integration.id ? 'Connecting...' : 'Connect'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
      ))}

      {integrations.length === 0 && (
        <div className="empty-state">
          <h3>No integrations available</h3>
          <p>Check back later for new integrations.</p>
        </div>
      )}

      {configModal && (
        <div className="modal-overlay" onClick={() => setConfigModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3>Configure {configModal.name}</h3>
              <button className="modal__close" onClick={() => setConfigModal(null)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleConfigSubmit}>
              {Object.entries(configModal.config_template || configModal.configTemplate || {}).map(
                ([key, schema]) => (
                  <div className="form-group" key={key}>
                    <label htmlFor={`config-${key}`}>
                      {schema.label || key}
                      {schema.required && <span className="required">*</span>}
                    </label>
                    <input
                      type={schema.type === 'password' ? 'password' : 'text'}
                      id={`config-${key}`}
                      value={configValues[key] || ''}
                      onChange={(e) =>
                        setConfigValues({ ...configValues, [key]: e.target.value })
                      }
                      placeholder={schema.placeholder || schema.description || ''}
                      required={schema.required}
                    />
                    {schema.description && (
                      <small className="form-help">{schema.description}</small>
                    )}
                  </div>
                )
              )}
              <div className="modal__actions">
                <button type="button" className="btn btn--outline" onClick={() => setConfigModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary" disabled={actionLoading === configModal.id}>
                  {actionLoading === configModal.id ? 'Connecting...' : 'Connect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
