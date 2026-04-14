import { Link } from 'react-router-dom';

const formatPrice = (price) => {
  if (price == null) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);
};

export default function PropertyCard({ property }) {
  const {
    id,
    title,
    price,
    city,
    state,
    property_type,
    bedrooms,
    bathrooms,
    square_feet,
    status,
    image_url,
  } = property;

  return (
    <Link to={`/properties/${id}`} className="property-card">
      <div className="property-card__image">
        {image_url ? (
          <img src={image_url} alt={title} />
        ) : (
          <div className="property-card__placeholder">
            <span>🏠</span>
          </div>
        )}
        {status && (
          <span className={`badge badge--${status.toLowerCase().replace(/\s+/g, '-')}`}>
            {status}
          </span>
        )}
      </div>
      <div className="property-card__body">
        <h3 className="property-card__title">{title || 'Untitled Property'}</h3>
        <p className="property-card__price">{formatPrice(price)}</p>
        <p className="property-card__location">
          📍 {city || 'Unknown'}{state ? `, ${state}` : ''}
        </p>
        {property_type && (
          <span className="badge badge--type">{property_type}</span>
        )}
        <div className="property-card__details">
          {bedrooms != null && <span>🛏 {bedrooms} bd</span>}
          {bathrooms != null && <span>🚿 {bathrooms} ba</span>}
          {square_feet != null && (
            <span>📐 {Number(square_feet).toLocaleString()} sqft</span>
          )}
        </div>
      </div>
    </Link>
  );
}
