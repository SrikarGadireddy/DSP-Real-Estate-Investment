import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProperty } from '../services/propertyService';
import { createInvestment } from '../services/investmentService';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const formatPrice = (price) => {
  if (price == null) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);
};

export default function PropertyDetail() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [investForm, setInvestForm] = useState({ amount: '', notes: '' });
  const [investLoading, setInvestLoading] = useState(false);
  const [investSuccess, setInvestSuccess] = useState('');
  const [investError, setInvestError] = useState('');

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const data = await getProperty(id);
        setProperty(data.property || data);
      } catch {
        setError('Property not found');
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id]);

  const handleInvest = async (e) => {
    e.preventDefault();
    setInvestError('');
    setInvestSuccess('');
    setInvestLoading(true);
    try {
      await createInvestment({
        property_id: Number(id),
        amount: Number(investForm.amount),
        notes: investForm.notes,
      });
      setInvestSuccess('Investment created successfully!');
      setInvestForm({ amount: '', notes: '' });
    } catch (err) {
      setInvestError(
        err.response?.data?.message || err.response?.data?.error || 'Failed to create investment'
      );
    } finally {
      setInvestLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) {
    return (
      <div className="error-page">
        <h2>{error}</h2>
        <Link to="/properties" className="btn btn--primary">
          Back to Properties
        </Link>
      </div>
    );
  }
  if (!property) return null;

  return (
    <div className="property-detail">
      <div className="property-detail__header">
        <Link to="/properties" className="btn btn--text">
          ← Back to Properties
        </Link>
      </div>

      <div className="property-detail__main">
        <div className="property-detail__gallery">
          {property.image_url ? (
            <img src={property.image_url} alt={property.title} className="property-detail__image" />
          ) : (
            <div className="property-detail__placeholder">
              <span>🏠</span>
              <p>No image available</p>
            </div>
          )}
        </div>

        <div className="property-detail__info">
          <div className="property-detail__title-row">
            <h1>{property.title || 'Untitled Property'}</h1>
            {property.status && (
              <span className={`badge badge--${property.status.toLowerCase().replace(/\s+/g, '-')} badge--lg`}>
                {property.status}
              </span>
            )}
          </div>

          <p className="property-detail__price">{formatPrice(property.price)}</p>

          <p className="property-detail__location">
            📍 {property.address || ''}{property.city ? `, ${property.city}` : ''}
            {property.state ? `, ${property.state}` : ''} {property.zip_code || ''}
          </p>

          {property.property_type && (
            <span className="badge badge--type">{property.property_type}</span>
          )}

          <div className="property-detail__specs">
            {property.bedrooms != null && (
              <div className="spec-item">
                <span className="spec-item__value">{property.bedrooms}</span>
                <span className="spec-item__label">Bedrooms</span>
              </div>
            )}
            {property.bathrooms != null && (
              <div className="spec-item">
                <span className="spec-item__value">{property.bathrooms}</span>
                <span className="spec-item__label">Bathrooms</span>
              </div>
            )}
            {property.square_feet != null && (
              <div className="spec-item">
                <span className="spec-item__value">{Number(property.square_feet).toLocaleString()}</span>
                <span className="spec-item__label">Sq Ft</span>
              </div>
            )}
            {property.year_built != null && (
              <div className="spec-item">
                <span className="spec-item__value">{property.year_built}</span>
                <span className="spec-item__label">Year Built</span>
              </div>
            )}
          </div>

          {property.description && (
            <div className="property-detail__description">
              <h3>Description</h3>
              <p>{property.description}</p>
            </div>
          )}

          {property.features && property.features.length > 0 && (
            <div className="property-detail__features">
              <h3>Features</h3>
              <ul>
                {property.features.map((f, i) => (
                  <li key={i}>✓ {f}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {isAuthenticated && (
        <div className="property-detail__invest">
          <h3>Make an Investment</h3>

          {investSuccess && <div className="alert alert--success">{investSuccess}</div>}
          {investError && <div className="alert alert--error">{investError}</div>}

          <form onSubmit={handleInvest} className="invest-form">
            <div className="form-group">
              <label htmlFor="invest-amount">Investment Amount ($)</label>
              <input
                type="number"
                id="invest-amount"
                value={investForm.amount}
                onChange={(e) => setInvestForm({ ...investForm, amount: e.target.value })}
                placeholder="Enter amount"
                min="1"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="invest-notes">Notes (optional)</label>
              <textarea
                id="invest-notes"
                value={investForm.notes}
                onChange={(e) => setInvestForm({ ...investForm, notes: e.target.value })}
                placeholder="Any additional notes"
                rows={3}
              />
            </div>
            <button type="submit" className="btn btn--primary" disabled={investLoading}>
              {investLoading ? 'Processing...' : 'Invest Now'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
