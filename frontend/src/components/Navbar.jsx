import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar__container">
        <Link to="/" className="navbar__brand" onClick={() => setMenuOpen(false)}>
          🏢 DSP Real Estate
        </Link>

        <button
          className={`navbar__toggle ${menuOpen ? 'active' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`navbar__menu ${menuOpen ? 'open' : ''}`}>
          <Link to="/properties" className="navbar__link" onClick={() => setMenuOpen(false)}>
            Properties
          </Link>
          <Link to="/search" className="navbar__link" onClick={() => setMenuOpen(false)}>
            Search
          </Link>

          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="navbar__link" onClick={() => setMenuOpen(false)}>
                Dashboard
              </Link>
              <Link to="/investments" className="navbar__link" onClick={() => setMenuOpen(false)}>
                Investments
              </Link>
              <Link to="/brochures" className="navbar__link" onClick={() => setMenuOpen(false)}>
                📄 Brochures
              </Link>
              <Link to="/ai-assistant" className="navbar__link" onClick={() => setMenuOpen(false)}>
                🤖 AI Advisor
              </Link>
              <Link to="/api-onboarding" className="navbar__link" onClick={() => setMenuOpen(false)}>
                API Portal
              </Link>
              <div className="navbar__user">
                <span className="navbar__username">
                  {user?.first_name || user?.email || 'User'}
                </span>
                <button className="btn btn--outline btn--sm" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="navbar__auth">
              <Link
                to="/login"
                className="btn btn--outline btn--sm"
                onClick={() => setMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="btn btn--primary btn--sm"
                onClick={() => setMenuOpen(false)}
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
