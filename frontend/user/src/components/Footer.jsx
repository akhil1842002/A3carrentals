import { Link } from 'react-router-dom';
import { FiMapPin, FiPhone, FiMail } from 'react-icons/fi';
import { FaInstagram, FaWhatsapp, FaFacebook, FaTwitter } from 'react-icons/fa';
import { getWhatsAppLink } from '../api';
import { useSettings } from '../context/SettingsContext';
import { renderBrandName } from '../utils/format';

export default function Footer() {
  const { settings } = useSettings();
  const brandName = settings?.businessName || 'A3 Car rental';
  const phoneDisplay = settings?.supportPhone || (settings?.whatsappNumber ? `+${settings.whatsappNumber}` : '+91 73970 98447');
  const emailDisplay = settings?.supportEmail || 'contact@carbookindia.com';
  const hubDisplay = settings?.hubAddress || 'Near by Jayamatha Hospital, Opp. Ration Shop, Kaliakkavillai, Panamkalai - 629153';

  // Dynamic social links from Admin settings
  const instagramUrl = (settings?.socialLinks?.instagram || settings?.instagramUrl || 'https://www.instagram.com/cabs_and_tyres?obrf=aHU4cnNnejljcGM5').trim();
  const facebookUrl = (settings?.socialLinks?.facebook || settings?.facebookUrl || '').trim();
  const twitterUrl = (settings?.socialLinks?.twitter || settings?.twitterUrl || '').trim();
  const whatsappUrl = getWhatsAppLink(`Hi! I visited your ${brandName} website.`, settings?.whatsappNumber);

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">{renderBrandName(brandName)}</div>
            <p>Your trusted partner for premium car rentals with {brandName}. Experience the best vehicles at affordable prices with exceptional service.</p>
            <ul className="footer-social">
              {/* Instagram - Active by default, admin manageable */}
              {instagramUrl && (
                <li>
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Follow ${brandName} on Instagram`}
                    aria-label="Instagram"
                  >
                    <FaInstagram />
                  </a>
                </li>
              )}

              {/* Facebook - Disabled unless admin adds a URL */}
              {facebookUrl && (
                <li>
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Connect with ${brandName} on Facebook`}
                    aria-label="Facebook"
                  >
                    <FaFacebook />
                  </a>
                </li>
              )}

              {/* Twitter / X - Disabled unless admin adds a URL */}
              {twitterUrl && (
                <li>
                  <a
                    href={twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Follow ${brandName} on Twitter / X`}
                    aria-label="Twitter"
                  >
                    <FaTwitter />
                  </a>
                </li>
              )}

              {/* WhatsApp Concierge */}
              <li>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Chat with ${brandName} on WhatsApp`}
                  aria-label="WhatsApp"
                >
                  <FaWhatsapp />
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4>Quick Links</h4>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/signup">Create Account</Link></li>
            </ul>
          </div>
          <div>
            <h4>Have Questions?</h4>
            <ul className="footer-links footer-contact">
              <li><FiMapPin /><span>{hubDisplay}</span></li>
              <li><FiPhone /><span>{phoneDisplay}</span></li>
              <li><FiMail /><span>{emailDisplay}</span></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>Copyright © {new Date().getFullYear()} {brandName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
