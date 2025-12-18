import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';
import logo from '../assets/logo.png';

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const handleMenuItemClick = () => {
    if (window.innerWidth <= 768) setMenuOpen(false);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    navigate('/');
  };

  return (
    <header>
      <div className="nav">
        <Link to="/dashboard" className="brand-link">
          <img src={logo} alt="Logo" className="logo-img" />
          <span className="brand-title">Nearprop</span>
        </Link>

        <nav className="desktop-nav">
          <ul className="nav-links">
            <li>
              <Link to="/dashboard" onClick={handleMenuItemClick}>
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/property" onClick={handleMenuItemClick}>
                Properties
              </Link>
            </li>
            <li>
              <Link to="/SubscriptionManagement" onClick={handleMenuItemClick}>
                Subscription
              </Link>
            </li>
            <li>
              <Link to="/feedpage" onClick={handleMenuItemClick}>
                Reel
              </Link>
            </li>
            <li>
              <Link to="/chatpanel" onClick={handleMenuItemClick}>
                ChatPanel
              </Link>
            </li>
            <li>
              <Link to="/VisitSchedule" onClick={handleMenuItemClick}>
                My Visits
              </Link>
            </li>
            <li>
              <Link to="/developerprofile" onClick={handleMenuItemClick}>
                Profile
              </Link>
            </li>
            <li>
              {isLoggedIn ? (
                <Link
                  onClick={handleLogout}
                  className="nav-logout-btn"
                  style={{ cursor: 'pointer', border: 'none', borderBottom: 'none', background: 'none', color: '#fff', padding: 0 }}
                >
                  Logout
                </Link>
              ) : (
                <Link to="/" onClick={handleMenuItemClick}>
                  Login
                </Link>
              )}
            </li>
          </ul>
        </nav>

        <div className="menu-toggle" onClick={toggleMenu}>
          <span></span><span></span><span></span>
        </div>
      </div>

      <div className={`mobile-menu ${menuOpen ? 'active' : ''}`}>
        <div className="mobile-menu-header">
          <img src={logo} alt="Logo" className="mobile-logo" />
          <span className="mobile-brand-title">Nearprop</span>
          <button className="mobile-menu-close" onClick={toggleMenu}>&times;</button>
        </div>
        <ul>
          <li>
            <Link to="/dashboard" onClick={handleMenuItemClick}>
              Dashboard
            </Link>
          </li>
          <li>
            <Link to="/property" onClick={handleMenuItemClick}>
              Properties
            </Link>
          </li>
          <li>
            <Link to="/SubscriptionManagement" onClick={handleMenuItemClick}>
              Subscription
            </Link>
          </li>
          <li>
            <Link to="/feedpage" onClick={handleMenuItemClick}>
              Reel
            </Link>
          </li>
          <li>
            <Link to="/chatpanel" onClick={handleMenuItemClick}>
              ChatPanel
            </Link>
          </li>
          <li>
            <Link to="/VisitSchedule" onClick={handleMenuItemClick}>
              My Visits
            </Link>
          </li>
          <li>
            <Link to="/profile" onClick={handleMenuItemClick}>
              Profile
            </Link>
          </li>
          <li>
            {isLoggedIn ? (
              <button
                onClick={() => {
                  handleLogout();
                  toggleMenu();
                }}
                className="btn btn-linkn"
                style={{ cursor: 'pointer', border: 'none', background: 'none', color: '#000', padding: '15px 20px' }}
              >
                Logout
              </button>
            ) : (
              <Link to="/" onClick={() => { handleMenuItemClick(); toggleMenu(); }}>
                Login
              </Link>
            )}
          </li>
        </ul>
      </div>
    </header>
  );
}

export default Header;