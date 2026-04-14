import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchProperties, getSavedSearches, saveSearch, deleteSavedSearch } from '../services/searchService';
import { useAuth } from '../context/AuthContext';
import PropertyCard from '../components/PropertyCard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedSearches, setSavedSearches] = useState([]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const [form, setForm] = useState({
    q: searchParams.get('q') || '',
    city: searchParams.get('city') || '',
    state: searchParams.get('state') || '',
    property_type: searchParams.get('property_type') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    bedrooms: searchParams.get('bedrooms') || '',
    bathrooms: searchParams.get('bathrooms') || '',
  });

  const doSearch = async (params) => {
    setLoading(true);
    try {
      const cleanParams = {};
      Object.entries(params).forEach(([k, v]) => {
        if (v) cleanParams[k] = v;
      });
      const data = await searchProperties(cleanParams);
      setResults(Array.isArray(data) ? data : data.properties || data.results || data.data || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const initialFormRef = useRef(form);

  useEffect(() => {
    const hasParams = Object.values(initialFormRef.current).some((v) => v);
    if (hasParams) doSearch(initialFormRef.current);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      getSavedSearches()
        .then((data) => setSavedSearches(Array.isArray(data) ? data : data.searches || data.data || []))
        .catch(() => {});
    }
  }, [isAuthenticated]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newParams = {};
    Object.entries(form).forEach(([k, v]) => {
      if (v) newParams[k] = v;
    });
    setSearchParams(newParams);
    doSearch(form);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSaveSearch = async () => {
    setSaveLoading(true);
    setSaveMsg('');
    try {
      const filters = {};
      Object.entries(form).forEach(([k, v]) => {
        if (v) filters[k] = v;
      });
      await saveSearch({ name: form.q || 'Custom Search', filters });
      setSaveMsg('Search saved!');
      const data = await getSavedSearches();
      setSavedSearches(Array.isArray(data) ? data : data.searches || data.data || []);
    } catch {
      setSaveMsg('Failed to save search');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteSaved = async (id) => {
    try {
      await deleteSavedSearch(id);
      setSavedSearches((prev) => prev.filter((s) => s.id !== id));
    } catch {
      /* ignore */
    }
  };

  const applySaved = (search) => {
    const filters = search.filters || search;
    const newForm = {
      q: filters.q || '',
      city: filters.city || '',
      state: filters.state || '',
      property_type: filters.property_type || '',
      min_price: filters.min_price || '',
      max_price: filters.max_price || '',
      bedrooms: filters.bedrooms || '',
      bathrooms: filters.bathrooms || '',
    };
    setForm(newForm);
    doSearch(newForm);
  };

  return (
    <div className="search-page">
      <aside className="search-sidebar">
        <h3>Search Filters</h3>
        <form onSubmit={handleSubmit}>
          <div className="filter-group">
            <label>Keyword</label>
            <input
              type="text"
              name="q"
              value={form.q}
              onChange={handleChange}
              placeholder="Search properties..."
            />
          </div>
          <div className="filter-group">
            <label>City</label>
            <input
              type="text"
              name="city"
              value={form.city}
              onChange={handleChange}
              placeholder="City"
            />
          </div>
          <div className="filter-group">
            <label>State</label>
            <input
              type="text"
              name="state"
              value={form.state}
              onChange={handleChange}
              placeholder="State"
            />
          </div>
          <div className="filter-group">
            <label>Property Type</label>
            <select name="property_type" value={form.property_type} onChange={handleChange}>
              <option value="">All Types</option>
              <option value="Single Family">Single Family</option>
              <option value="Multi Family">Multi Family</option>
              <option value="Condo">Condo</option>
              <option value="Townhouse">Townhouse</option>
              <option value="Commercial">Commercial</option>
              <option value="Land">Land</option>
              <option value="Industrial">Industrial</option>
            </select>
          </div>
          <div className="filter-row">
            <div className="filter-group">
              <label>Min Price</label>
              <input type="number" name="min_price" value={form.min_price} onChange={handleChange} placeholder="$0" />
            </div>
            <div className="filter-group">
              <label>Max Price</label>
              <input type="number" name="max_price" value={form.max_price} onChange={handleChange} placeholder="No limit" />
            </div>
          </div>
          <div className="filter-row">
            <div className="filter-group">
              <label>Bedrooms</label>
              <input type="number" name="bedrooms" value={form.bedrooms} onChange={handleChange} placeholder="Any" min="0" />
            </div>
            <div className="filter-group">
              <label>Bathrooms</label>
              <input type="number" name="bathrooms" value={form.bathrooms} onChange={handleChange} placeholder="Any" min="0" />
            </div>
          </div>
          <button type="submit" className="btn btn--primary btn--full">
            Search
          </button>
        </form>

        {isAuthenticated && (
          <div className="search-sidebar__actions">
            <button
              className="btn btn--outline btn--full"
              onClick={handleSaveSearch}
              disabled={saveLoading}
            >
              {saveLoading ? 'Saving...' : '💾 Save This Search'}
            </button>
            {saveMsg && <p className="text-small text-muted">{saveMsg}</p>}
          </div>
        )}

        {isAuthenticated && savedSearches.length > 0 && (
          <div className="saved-searches">
            <h4>Saved Searches</h4>
            {savedSearches.map((s) => (
              <div key={s.id} className="saved-search-item">
                <button className="saved-search-item__name" onClick={() => applySaved(s)}>
                  {s.name || 'Saved Search'}
                </button>
                <button
                  className="saved-search-item__delete"
                  onClick={() => handleDeleteSaved(s.id)}
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </aside>

      <main className="search-results">
        <h2>Search Results</h2>
        {loading ? (
          <LoadingSpinner />
        ) : results.length > 0 ? (
          <div className="property-grid">
            {results.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>No results found</h3>
            <p>Try different search criteria.</p>
          </div>
        )}
      </main>
    </div>
  );
}
