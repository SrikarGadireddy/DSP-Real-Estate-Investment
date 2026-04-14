import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getProperties } from '../services/propertyService';
import PropertyCard from '../components/PropertyCard';
import LoadingSpinner from '../components/LoadingSpinner';

const PROPERTY_TYPES = [
  'All Types',
  'Single Family',
  'Multi Family',
  'Condo',
  'Townhouse',
  'Commercial',
  'Land',
  'Industrial',
];

const STATUSES = ['All Statuses', 'Available', 'Under Contract', 'Sold', 'Off Market'];

export default function Properties() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    property_type: searchParams.get('property_type') || '',
    status: searchParams.get('status') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        const params = { page, limit: 12 };
        if (filters.property_type && filters.property_type !== 'All Types')
          params.property_type = filters.property_type;
        if (filters.status && filters.status !== 'All Statuses')
          params.status = filters.status;
        if (filters.min_price) params.min_price = filters.min_price;
        if (filters.max_price) params.max_price = filters.max_price;

        const data = await getProperties(params);
        const list = Array.isArray(data) ? data : data.properties || data.data || [];
        setProperties(list);
        setTotalPages(data.total_pages || data.totalPages || Math.ceil((data.total || list.length) / 12) || 1);
      } catch {
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, [filters, page]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
    const newParams = { ...filters, [key]: value };
    Object.keys(newParams).forEach((k) => {
      if (!newParams[k] || newParams[k].startsWith('All')) delete newParams[k];
    });
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setFilters({ property_type: '', status: '', min_price: '', max_price: '' });
    setSearchParams({});
    setPage(1);
  };

  return (
    <div className="properties-page">
      <aside className="filter-sidebar">
        <div className="filter-sidebar__header">
          <h3>Filters</h3>
          <button className="btn btn--text btn--sm" onClick={clearFilters}>
            Clear All
          </button>
        </div>

        <div className="filter-group">
          <label>Property Type</label>
          <select
            value={filters.property_type || 'All Types'}
            onChange={(e) => handleFilterChange('property_type', e.target.value)}
          >
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Status</label>
          <select
            value={filters.status || 'All Statuses'}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Min Price ($)</label>
          <input
            type="number"
            placeholder="0"
            value={filters.min_price}
            onChange={(e) => handleFilterChange('min_price', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Max Price ($)</label>
          <input
            type="number"
            placeholder="No limit"
            value={filters.max_price}
            onChange={(e) => handleFilterChange('max_price', e.target.value)}
          />
        </div>
      </aside>

      <main className="properties-main">
        <div className="properties-main__header">
          <h2>Properties</h2>
          <span className="properties-main__count">
            {properties.length} {properties.length === 1 ? 'property' : 'properties'}
          </span>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : properties.length > 0 ? (
          <>
            <div className="property-grid">
              {properties.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="btn btn--outline btn--sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ← Previous
                </button>
                <span className="pagination__info">
                  Page {page} of {totalPages}
                </span>
                <button
                  className="btn btn--outline btn--sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <h3>No properties found</h3>
            <p>Try adjusting your filters or check back later.</p>
          </div>
        )}
      </main>
    </div>
  );
}
