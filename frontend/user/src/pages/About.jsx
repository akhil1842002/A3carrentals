import { Link } from 'react-router-dom';
import { 
  FiCheck, 
  FiMapPin, 
  FiNavigation, 
  FiClock, 
  FiPhone, 
  FiExternalLink 
} from 'react-icons/fi';
import { 
  FaCar, 
  FaShieldAlt, 
  FaHeadset, 
  FaUserTie, 
  FaWhatsapp 
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { getWhatsAppLink } from '../api';

const DEFAULT_MAP_EMBED = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15791.058512382906!2d77.15638885576467!3d8.326171267354821!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b05ab2e7848b5e1%3A0xbe02000328d9065!2sA3%20Car%20rental!5e0!3m2!1sen!2sin!4v1793281171962!5m2!1sen!2sin';
const DEFAULT_COMPANY_ADDRESS = 'Near by Jayamatha Hospital, Opp. Ration Shop, Kaliakkavillai, Panamkalai - 629153';

export default function About() {
  const { isAuthenticated } = useAuth();
  const { settings } = useSettings();
  const lp = settings?.landingPage || {};

  // Company location details
  const companyAddress = lp?.companyLocation || settings?.hubAddress || DEFAULT_COMPANY_ADDRESS;
  const companyEmbedUrl = lp?.companyMapEmbedUrl || settings?.googleMapsEmbedUrl || DEFAULT_MAP_EMBED;
  const companyNotes = lp?.companyLocationNotes || 'Near by Jayamatha Hospital, Opp. Ration Shop';

  const mapSrc = companyEmbedUrl;
  const directionsUrl = 'https://www.google.com/maps/search/?api=1&query=A3+Car+rental+Kaliakkavillai+panamkalai+629153';

  return (
    <div className="about-page">
      {/* Page Header */}
      <section className="page-header" style={{ backgroundImage: `url('${lp.heroBgImage || '/images/bg_1.jpg'}')` }}>
        <div className="hero-overlay"></div>
        <div className="container">
          <div className="page-header-content">
            <div className="breadcrumb">
              <Link to="/">Home</Link> <span>/</span> <span>About Us</span>
            </div>
            <h1>About {settings?.businessName || 'A3 Car rental'}</h1>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '15px', marginTop: '8px' }}>
              Redefining automotive rentals and chauffeur travel with luxury, transparency, and safety across India.
            </p>
          </div>
        </div>
      </section>

      {/* Main Story & About Wrapper */}
      <section className="section" style={{ padding: '70px 0' }}>
        <div className="container">
          <div className="about-wrapper">
            <div className="about-image" style={{ backgroundImage: `url('${lp.aboutImage || '/images/about.jpg'}')` }}>
              <div className="about-badge">
                <span className="years">{lp.aboutBadgeYears || '10+'}</span>
                <span className="text">{lp.aboutBadgeText || 'Years of Excellence'}</span>
              </div>
            </div>
            <div className="about-content">
              <span className="subheading">Our Commitment</span>
              <h2>{lp.aboutTitle || 'Premium Vehicles, Effortless Journeys'}</h2>
              <p>
                {lp.aboutDesc || 'Founded with a mission to bring world-class mobility to Kaliakkavilai and surrounding regions, A3 Car Rentals offers a meticulously curated fleet of top-tier sedans, rugged SUVs, executive luxury vehicles, and economical family cars.'}
              </p>
              <p>
                Every vehicle in our fleet undergoes rigorous multi-point mechanical inspection and complete interior 
                sanitization before being handed over. Whether choosing self-drive freedom or traveling with our professional 
                verified drivers, you are guaranteed peak comfort, reliability, and peace of mind.
              </p>
              <ul className="about-list">
                <li><FiCheck /> <strong>{lp.aboutFeature1 || '24/7 dedicated customer assistance & roadside support'}</strong></li>
                <li><FiCheck /> <strong>{lp.aboutFeature2 || 'Over 50+ premium vehicles across sports, luxury, and SUV categories'}</strong></li>
                <li><FiCheck /> <strong>{lp.aboutFeature3 || 'Easy online booking with real-time availability'}</strong></li>
                <li><FiCheck /> <strong>{lp.aboutFeature4 || 'Transparent pricing with no hidden charges'}</strong></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values Strip */}
      <section className="section bg-light" style={{ padding: '70px 0' }}>
        <div className="container">
          <div className="section-header">
            <span className="subheading">Why Choose Us</span>
            <h2>The {settings?.businessName || 'A3 Car rental'} Advantage</h2>
            <p>Built from the ground up to provide seamless customer satisfaction</p>
          </div>
          <div className="services-grid">
            <div className="service-card">
              <div className="service-icon"><FaCar /></div>
              <h3>Pristine Vehicle Fleet</h3>
              <p>From fuel-efficient city commuters to exotic executive limousines, all in peak mechanical condition.</p>
            </div>
            <div className="service-card">
              <div className="service-icon"><FaUserTie /></div>
              <h3>Certified Professional Drivers</h3>
              <p>Professional, background-checked, and courteous drivers available on demand for all bookings.</p>
            </div>
            <div className="service-card">
              <div className="service-icon"><FaShieldAlt /></div>
              <h3>Comprehensive Coverage</h3>
              <p>Full comprehensive insurance and clear return inspection protocols protecting every rental.</p>
            </div>
            <div className="service-card">
              <div className="service-icon"><FaHeadset /></div>
              <h3>Instant WhatsApp Concierge</h3>
              <p>Real-time booking confirmation, flight delay adjustments, and support via WhatsApp.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Counter */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">{lp.stat1Number || '56+'}</div>
              <div className="stat-label">{lp.stat1Label || 'Available Vehicles'}</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{lp.stat2Number || '2,400+'}</div>
              <div className="stat-label">{lp.stat2Label || 'Happy Customers'}</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{lp.stat3Number || '100%'}</div>
              <div className="stat-label">{lp.stat3Label || 'Satisfaction Rate'}</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{lp.stat4Number || '24/7'}</div>
              <div className="stat-label">{lp.stat4Label || 'Customer Support'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Company Location & Map Section - Contained & Bordered (Not Full Screen) */}
      <section className="about-map-section" id="company-map" style={{ padding: '60px 0', background: '#f8fafc' }}>
        <div className="container" style={{ maxWidth: '880px', margin: '0 auto', padding: '0 16px' }}>
          
          {/* Section Header */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <span style={{ 
              color: 'var(--primary, #f96d00)', 
              fontWeight: 700, 
              letterSpacing: '1px', 
              textTransform: 'uppercase', 
              fontSize: '12px' 
            }}>
              OUR COMPANY LOCATION
            </span>
            <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', marginTop: '4px', marginBottom: '8px' }}>
              Find Us on the Map
            </h2>
            <p style={{ maxWidth: '620px', margin: '0 auto', color: '#64748b', fontSize: '14px', lineHeight: 1.5 }}>
              Visit <strong>A3 Car rental</strong> near Jayamatha Hospital, Kaliakkavillai, Panamkalai. We are conveniently situated right opposite the ration shop.
            </p>
          </div>

          {/* Centered Box (Not Full Screen) with Visible Border */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '2px solid #cbd5e1',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.06)',
            padding: '20px',
            maxWidth: '850px',
            margin: '0 auto'
          }}>
            {/* Top Company Info Bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              paddingBottom: '16px',
              marginBottom: '16px',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'rgba(249, 109, 0, 0.12)',
                    color: 'var(--primary, #f96d00)',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px'
                  }}>
                    A3 Car Rental Hub
                  </span>
                  <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a', display: 'inline-block' }}></span>
                    Open Today ({settings?.operatingHours || '8:00 AM – 10:00 PM'})
                  </span>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>
                  A3 Car Rental Headquarters
                </h3>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', color: '#475569', fontSize: '13px' }}>
                  <FiMapPin style={{ color: 'var(--primary, #f96d00)', marginTop: '3px', flexShrink: 0 }} size={14} />
                  <span>
                    Near by Jayamatha hospital, Landmark: Opposite ration shop, Kaliakkavillai, Panamkalai - 629153
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    textDecoration: 'none'
                  }}
                >
                  <FiNavigation size={13} /> Get Directions
                </a>
                <a
                  href={`tel:${(settings?.supportPhone || '+91 73970 98447').replace(/[^0-9+]/g, '')}`}
                  className="btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: '#f1f5f9',
                    color: '#0f172a',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                    fontWeight: 600,
                    textDecoration: 'none'
                  }}
                >
                  <FiPhone size={13} /> Call
                </a>
                <a
                  href={getWhatsAppLink(`Hi A3 Car rental! I am looking for your hub at Kaliakkavillai, Panamkalai.`, settings?.whatsappNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-whatsapp"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    textDecoration: 'none'
                  }}
                >
                  <FaWhatsapp size={14} /> WhatsApp
                </a>
              </div>
            </div>

            {/* Map Frame with Strong Visible Border (Not Full Screen) */}
            <div style={{
              position: 'relative',
              width: '100%',
              height: '350px',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '2px solid #94a3b8',
              boxShadow: 'inset 0 0 10px rgba(0,0,0,0.06)',
              background: '#e2e8f0'
            }}>
              <iframe
                title="A3 Car rental Location Map"
                src={mapSrc}
                width="100%"
                height="100%"
                style={{
                  border: 0,
                  display: 'block',
                  width: '100%',
                  height: '100%'
                }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />

              {/* Floating Pin Point Badge */}
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'rgba(15, 23, 42, 0.92)',
                backdropFilter: 'blur(6px)',
                color: '#ffffff',
                padding: '6px 12px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                zIndex: 2,
                border: '1px solid rgba(255,255,255,0.15)'
              }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: 'var(--primary, #f96d00)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff'
                }}>
                  <FiMapPin size={10} />
                </div>
                <span>A3 Car rental • Kaliakkavillai</span>
              </div>

              {/* Bottom Interactive Point Bar */}
              <div style={{
                position: 'absolute',
                bottom: '10px',
                left: '10px',
                right: '10px',
                background: 'rgba(255, 255, 255, 0.96)',
                backdropFilter: 'blur(6px)',
                padding: '8px 12px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                zIndex: 2,
                fontSize: '11px',
                color: '#334155',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: 'var(--primary, #f96d00)', fontWeight: 700 }}>● Exact Hub Location:</span>
                  <span style={{ color: '#475569' }}>Kaliakkavillai, Panamkalai - 629153</span>
                </div>
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: 'var(--primary, #f96d00)',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    textDecoration: 'none'
                  }}
                >
                  Open in Google Maps <FiExternalLink size={11} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="section" style={{ padding: '60px 0 70px', textAlign: 'center' }}>
        <div className="container">
          <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            <span className="subheading">Start Your Journey</span>
            <h2 style={{ fontSize: '28px', marginTop: '8px', marginBottom: '12px' }}>Ready to Experience Premium Mobility?</h2>
            <p style={{ color: '#6b7280', fontSize: '15px', marginBottom: '24px', lineHeight: 1.6 }}>
              Choose from our curated fleet of luxury sedans, rugged SUVs, and executive cars. Enjoy transparent pricing, 24/7 support, and complete peace of mind.
            </p>
            <Link to={isAuthenticated ? '/dashboard' : '/signup'} className="btn btn-primary" style={{ padding: '12px 30px', fontSize: '14px' }}>
              {isAuthenticated ? 'Browse Fleet & Book' : 'Create Free Account & Book'}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
