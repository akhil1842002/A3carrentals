import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiMenu, FiX } from 'react-icons/fi';
import { useSettings } from '../context/SettingsContext';
import { renderBrandName } from '../utils/format';

export default function Navbar() {
  const { settings } = useSettings();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const isActive = (path) => (location.pathname === path ? 'active' : '');

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" className="navbar-brand">
          {renderBrandName(settings?.businessName || 'CarBook')}
        </Link>

        {/* Clean Public Navigation Menu */}
        <ul className={`nav-links ${menuOpen ? 'open' : ''}`}>
          <li>
            <Link to="/" className={isActive('/')}>Home</Link>
          </li>
          <li>
            <Link to="/about" className={isActive('/about')}>About Us</Link>
          </li>
          <li>
            <Link to="/contact" className={isActive('/contact')}>Contact</Link>
          </li>
          
          <li className="nav-auth-btns">
            <Link to="/login" className="nav-login-link">Login</Link>
            <Link to="/signup" className="nav-signup-btn">Book Now</Link>
          </li>
        </ul>

        {/* Mobile Hamburger Toggle */}
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle Navigation">
          {menuOpen ? <FiX size={24} color="#fff" /> : <FiMenu size={24} color="#fff" />}
        </button>
      </div>
    </nav>
  );
}
