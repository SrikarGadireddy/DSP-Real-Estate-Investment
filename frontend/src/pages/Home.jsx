import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getProperties } from '../services/propertyService';
import PropertyCard from '../components/PropertyCard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Home() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const data = await getProperties({ limit: 6 });
        setProperties(Array.isArray(data) ? data : data.properties || data.data || []);
      } catch {
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className="home">
      <section className="hero">
        <div className="hero__content">
          <h1>Invest in Real Estate with Confidence</h1>
          <p>
            Discover premium properties, track your investments, and grow your portfolio
            with DSP Real Estate Investment platform.
          </p>
          <form className="hero__search" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search by city, state, or property type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="btn btn--primary">
              Search
            </button>
          </form>
        </div>
      </section>

      <section className="stats-bar">
        <div className="stats-bar__container">
          <div className="stat-item">
            <span className="stat-item__number">500+</span>
            <span className="stat-item__label">Properties Listed</span>
          </div>
          <div className="stat-item">
            <span className="stat-item__number">$2B+</span>
            <span className="stat-item__label">Total Invested</span>
          </div>
          <div className="stat-item">
            <span className="stat-item__number">10K+</span>
            <span className="stat-item__label">Active Investors</span>
          </div>
          <div className="stat-item">
            <span className="stat-item__number">12%</span>
            <span className="stat-item__label">Avg. ROI</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section__header">
          <h2>Featured Properties</h2>
          <Link to="/properties" className="btn btn--outline">
            View All →
          </Link>
        </div>
        {loading ? (
          <LoadingSpinner />
        ) : properties.length > 0 ? (
          <div className="property-grid">
            {properties.slice(0, 6).map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No properties available yet. Check back soon!</p>
          </div>
        )}
      </section>

      <section className="cta-section">
        <div className="cta-card">
          <div className="cta-card__icon">📊</div>
          <h3>Track Your Portfolio</h3>
          <p>Monitor your investments in real-time with our comprehensive dashboard.</p>
          <Link to="/dashboard" className="btn btn--primary">
            View Dashboard
          </Link>
        </div>
        <div className="cta-card">
          <div className="cta-card__icon">🔍</div>
          <h3>Advanced Search</h3>
          <p>Find the perfect property using our powerful search and filtering tools.</p>
          <Link to="/search" className="btn btn--primary">
            Search Properties
          </Link>
        </div>
        <div className="cta-card">
          <div className="cta-card__icon">🔗</div>
          <h3>API Access</h3>
          <p>Integrate our platform with your tools using our developer-friendly API.</p>
          <Link to="/api-onboarding" className="btn btn--primary">
            Get API Keys
          </Link>
        </div>
      </section>
    </div>
  );
}
