import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, isAuthenticated } = useAuth();
  const isDashboard = location.pathname === '/dashboard';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <header className="header">
        <nav className="nav">
          <Link to="/" className="logo">
            <div className="logo-icon">A</div>
            AISER
          </Link>
          <div className="nav-actions">
            {isDashboard || (isAuthenticated && (location.pathname === '/kyc')) ? (
              <>
                <Link to="/" className="log-in-btn">
                  Home
                </Link>
                <button className="signup-btn" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : isAuthenticated ? (
              <>
                <Link to="/dashboard" className="log-in-btn">
                  Dashboard
                </Link>
                <button className="signup-btn" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
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
      {children}
    </>
  );
};

export default Layout;
