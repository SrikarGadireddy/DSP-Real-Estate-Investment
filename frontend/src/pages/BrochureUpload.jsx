import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import brochureService from '../services/brochureService';

export default function BrochureUpload() {
  const [brochures, setBrochures] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [selectedBrochure, setSelectedBrochure] = useState(null);
  const [creatingProperty, setCreatingProperty] = useState(false);
  const [editFields, setEditFields] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadBrochures();
  }, []);

  async function loadBrochures() {
    try {
      const { data } = await brochureService.list();
      setBrochures(data.brochures || []);
    } catch {
      // silently ignore
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (file) uploadFile(file);
  }

  async function uploadFile(file) {
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are accepted.');
      return;
    }
    setError('');
    setSuccess('');
    setUploading(true);
    setUploadProgress(0);

    try {
      const { data } = await brochureService.upload(file, (e) => {
        if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100));
      });
      setSuccess('Brochure analyzed successfully! Review the extracted data below.');
      await loadBrochures();
      openBrochure(data.brochure);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function openBrochure(b) {
    setSelectedBrochure(b);
    setEditFields(b.extracted_data || {});
  }

  async function handleCreateProperty() {
    if (!selectedBrochure) return;
    setCreatingProperty(true);
    setError('');
    try {
      const { data } = await brochureService.createProperty(selectedBrochure.id, editFields);
      setSuccess(`Property listing "${data.property.title}" created successfully!`);
      await loadBrochures();
      setSelectedBrochure(null);
      setTimeout(() => navigate(`/properties/${data.property.id}`), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create property listing.');
    } finally {
      setCreatingProperty(false);
    }
  }

  async function handleDelete(id, e) {
    e.stopPropagation();
    if (!window.confirm('Delete this brochure record?')) return;
    try {
      await brochureService.delete(id);
      await loadBrochures();
      if (selectedBrochure?.id === id) setSelectedBrochure(null);
    } catch {
      setError('Failed to delete brochure.');
    }
  }

  function fieldChange(key, value) {
    setEditFields((prev) => ({ ...prev, [key]: value }));
  }

  const statusBadge = (status) => {
    const map = {
      completed: 'badge badge--success',
      processing: 'badge badge--warning',
      failed: 'badge badge--danger',
      pending: 'badge badge--secondary',
    };
    return map[status] || 'badge badge--secondary';
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">📄 Brochure Upload & AI Analysis</h1>
        <p className="page-subtitle">
          Upload a PDF property brochure. Our AI will extract all key details and create a
          property listing for you automatically.
        </p>
      </div>

      {error && <div className="alert alert--danger">{error}</div>}
      {success && <div className="alert alert--success">{success}</div>}

      {/* Upload Zone */}
      <div
        className={`brochure-dropzone ${dragOver ? 'brochure-dropzone--active' : ''} ${uploading ? 'brochure-dropzone--uploading' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="visually-hidden"
          onChange={handleFileChange}
        />
        {uploading ? (
          <div className="brochure-dropzone__uploading">
            <div className="spinner" />
            <p>Uploading &amp; analyzing with AI… {uploadProgress}%</p>
            <div className="progress-bar">
              <div className="progress-bar__fill" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        ) : (
          <div className="brochure-dropzone__idle">
            <span className="brochure-dropzone__icon">📂</span>
            <p className="brochure-dropzone__label">
              Drag &amp; drop a PDF brochure here, or <strong>click to browse</strong>
            </p>
            <p className="brochure-dropzone__hint">Maximum file size: 20 MB · PDF only</p>
          </div>
        )}
      </div>

      {/* Two-column layout: list + detail */}
      <div className="brochure-layout">
        {/* Brochure List */}
        <div className="brochure-list-panel">
          <h2 className="panel-title">Uploaded Brochures</h2>
          {brochures.length === 0 ? (
            <div className="empty-state">
              <p>No brochures uploaded yet.</p>
            </div>
          ) : (
            <ul className="brochure-list">
              {brochures.map((b) => (
                <li
                  key={b.id}
                  className={`brochure-item ${selectedBrochure?.id === b.id ? 'brochure-item--active' : ''}`}
                  onClick={() => openBrochure(b)}
                >
                  <div className="brochure-item__info">
                    <span className="brochure-item__name">{b.original_name}</span>
                    <span className={statusBadge(b.status)}>{b.status}</span>
                  </div>
                  <div className="brochure-item__meta">
                    <span>{new Date(b.created_at).toLocaleDateString()}</span>
                    {b.property_id && (
                      <span
                        className="link"
                        onClick={(e) => { e.stopPropagation(); navigate(`/properties/${b.property_id}`); }}
                      >
                        View Property →
                      </span>
                    )}
                    <button
                      className="btn btn--danger btn--xs"
                      onClick={(e) => handleDelete(b.id, e)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Extracted Data Detail */}
        {selectedBrochure && (
          <div className="brochure-detail-panel">
            <div className="brochure-detail__header">
              <h2 className="panel-title">Extracted Data</h2>
              <button className="btn btn--outline btn--sm" onClick={() => setSelectedBrochure(null)}>
                ✕ Close
              </button>
            </div>

            {selectedBrochure.ai_summary && (
              <div className="ai-summary">
                <strong>🤖 AI Summary:</strong>
                <p>{selectedBrochure.ai_summary}</p>
              </div>
            )}

            <div className="extracted-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Title</label>
                  <input
                    className="form-control"
                    value={editFields.title || ''}
                    onChange={(e) => fieldChange('title', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Property Type</label>
                  <select
                    className="form-control"
                    value={editFields.property_type || 'residential'}
                    onChange={(e) => fieldChange('property_type', e.target.value)}
                  >
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="industrial">Industrial</option>
                    <option value="land">Land</option>
                    <option value="mixed-use">Mixed-Use</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Address</label>
                <input
                  className="form-control"
                  value={editFields.address || ''}
                  onChange={(e) => fieldChange('address', e.target.value)}
                />
              </div>

              <div className="form-row form-row--3">
                <div className="form-group">
                  <label>City</label>
                  <input
                    className="form-control"
                    value={editFields.city || ''}
                    onChange={(e) => fieldChange('city', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input
                    className="form-control"
                    value={editFields.state || ''}
                    onChange={(e) => fieldChange('state', e.target.value)}
                    maxLength={2}
                  />
                </div>
                <div className="form-group">
                  <label>ZIP Code</label>
                  <input
                    className="form-control"
                    value={editFields.zip_code || ''}
                    onChange={(e) => fieldChange('zip_code', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row form-row--3">
                <div className="form-group">
                  <label>Price ($)</label>
                  <input
                    className="form-control"
                    type="number"
                    value={editFields.price || ''}
                    onChange={(e) => fieldChange('price', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Bedrooms</label>
                  <input
                    className="form-control"
                    type="number"
                    value={editFields.bedrooms || ''}
                    onChange={(e) => fieldChange('bedrooms', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Bathrooms</label>
                  <input
                    className="form-control"
                    type="number"
                    step="0.5"
                    value={editFields.bathrooms || ''}
                    onChange={(e) => fieldChange('bathrooms', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row form-row--3">
                <div className="form-group">
                  <label>Square Feet</label>
                  <input
                    className="form-control"
                    type="number"
                    value={editFields.square_feet || ''}
                    onChange={(e) => fieldChange('square_feet', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Year Built</label>
                  <input
                    className="form-control"
                    type="number"
                    value={editFields.year_built || ''}
                    onChange={(e) => fieldChange('year_built', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Parking Spaces</label>
                  <input
                    className="form-control"
                    type="number"
                    value={editFields.parking_spaces || ''}
                    onChange={(e) => fieldChange('parking_spaces', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={editFields.description || ''}
                  onChange={(e) => fieldChange('description', e.target.value)}
                />
              </div>

              {!selectedBrochure.property_id ? (
                <button
                  className="btn btn--primary btn--full"
                  onClick={handleCreateProperty}
                  disabled={creatingProperty}
                >
                  {creatingProperty ? 'Creating…' : '🏠 Create Property Listing'}
                </button>
              ) : (
                <div className="alert alert--success">
                  ✅ Property listing already created.{' '}
                  <span
                    className="link"
                    onClick={() => navigate(`/properties/${selectedBrochure.property_id}`)}
                  >
                    View it →
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
