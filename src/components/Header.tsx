import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header: React.FC = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const isDashboard = location.pathname === '/dashboard';

  return (
    <header className="header">
      <nav className="nav">
        <Link to="/" className="logo">
          <div className="logo-icon">A</div>
          AISER
        </Link>
        <div className="nav-actions">
          {isDashboard ? (
            <>
              <Link to="/" className="log-in-btn">
                Home
              </Link>
              <button className="signup-btn">
                Logout
              </button>
            </>
          ) : isAuthPage ? (
            <Link to="/" className="back-home">
              ← Back to Home
            </Link>
          ) : (
            <>
              <Link to="/dashboard" className="log-in-btn">
                Dashboard
              </Link>
              <Link to="/login" className="log-in-btn">
                Log in
              </Link>
              <Link to="/signup" className="signup-btn">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
