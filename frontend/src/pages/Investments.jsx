import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getInvestments, deleteInvestment, createInvestment, updateInvestment } from '../services/investmentService';
import { getProperties } from '../services/propertyService';
import LoadingSpinner from '../components/LoadingSpinner';

const formatCurrency = (val) => {
  if (val == null) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(val);
};

export default function Investments() {
  const [investments, setInvestments] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ property_id: '', amount: '', notes: '' });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const fetchInvestments = async () => {
    try {
      const data = await getInvestments();
      setInvestments(Array.isArray(data) ? data : data.investments || data.data || []);
    } catch {
      setError('Failed to load investments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchInvestments();
      try {
        const pData = await getProperties({ limit: 100 });
        setProperties(Array.isArray(pData) ? pData : pData.properties || pData.data || []);
      } catch {
        /* properties list is optional for the dropdown */
      }
    };
    init();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ property_id: '', amount: '', notes: '' });
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (inv) => {
    setEditingId(inv.id);
    setForm({
      property_id: inv.property_id || '',
      amount: inv.amount || '',
      notes: inv.notes || '',
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      const payload = {
        property_id: Number(form.property_id),
        amount: Number(form.amount),
        notes: form.notes,
      };
      if (editingId) {
        await updateInvestment(editingId, payload);
      } else {
        await createInvestment(payload);
      }
      setShowModal(false);
      setLoading(true);
      await fetchInvestments();
    } catch (err) {
      setFormError(err.response?.data?.message || err.response?.data?.error || 'Operation failed');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this investment?')) return;
    try {
      await deleteInvestment(id);
      setInvestments((prev) => prev.filter((inv) => inv.id !== id));
    } catch {
      setError('Failed to delete investment');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="investments-page">
      <div className="page-header">
        <h1>My Investments</h1>
        <button className="btn btn--primary" onClick={openCreate}>
          + New Investment
        </button>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      {investments.length > 0 ? (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Property</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {investments.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <Link to={`/properties/${inv.property_id}`}>
                      {inv.property_title || inv.property?.title || `Property #${inv.property_id}`}
                    </Link>
                  </td>
                  <td className="text-bold">{formatCurrency(inv.amount)}</td>
                  <td>
                    <span className={`badge badge--${(inv.status || 'pending').toLowerCase()}`}>
                      {inv.status || 'Pending'}
                    </span>
                  </td>
                  <td>{inv.created_at ? new Date(inv.created_at).toLocaleDateString() : 'N/A'}</td>
                  <td className="text-muted">{inv.notes || '—'}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn btn--outline btn--sm" onClick={() => openEdit(inv)}>
                        Edit
                      </button>
                      <button className="btn btn--danger btn--sm" onClick={() => handleDelete(inv.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <h3>No investments yet</h3>
          <p>Start by browsing properties and making your first investment.</p>
          <Link to="/properties" className="btn btn--primary">
            Browse Properties
          </Link>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3>{editingId ? 'Edit Investment' : 'New Investment'}</h3>
              <button className="modal__close" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>
            {formError && <div className="alert alert--error">{formError}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="property_id">Property</label>
                <select
                  id="property_id"
                  value={form.property_id}
                  onChange={(e) => setForm({ ...form, property_id: e.target.value })}
                  required
                >
                  <option value="">Select a property</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title || `Property #${p.id}`} — {formatCurrency(p.price)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="amount">Amount ($)</label>
                <input
                  type="number"
                  id="amount"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="Enter investment amount"
                  min="1"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Optional notes"
                  rows={3}
                />
              </div>
              <div className="modal__actions">
                <button type="button" className="btn btn--outline" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary" disabled={formLoading}>
                  {formLoading ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
