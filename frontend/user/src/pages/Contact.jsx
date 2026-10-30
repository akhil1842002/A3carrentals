import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMapPin, FiPhone, FiMail, FiClock } from 'react-icons/fi';
import { FaWhatsapp, FaInstagram, FaFacebook, FaTwitter } from 'react-icons/fa';
import { getWhatsAppLink } from '../api';
import { useSettings } from '../context/SettingsContext';
import useSeo from '../hooks/useSeo';

export default function Contact() {
  useSeo({
    title: 'Contact A3 Car Rentals — Kaliakkavilai',
    description: 'Contact A3 Car Rentals at our hub near Jayamatha Hospital, Opp. Ration Shop, Kaliakkavilai - 629153. Call or WhatsApp +91 73970 98447. Open Mon-Sun 8AM to 10PM.',
    canonical: 'https://a3carrentals.in/contact',
    keywords: ['contact A3 Car Rentals', 'car rental contact Kaliakkavilai', 'book car Marthandam phone number', 'A3 car rental WhatsApp', 'car rental enquiry Kaliakkavilai']
  });
  const { settings } = useSettings();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) {
      errs.name = 'Please enter your name';
    }
    if (!form.email.trim()) {
      errs.email = 'Please enter your email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Please enter a valid email address';
    }
    if (!form.subject.trim()) {
      errs.subject = 'Please enter a subject';
    }
    if (!form.message.trim()) {
      errs.message = 'Please enter your message';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const brand = settings?.businessName || 'CarBook';
    const msg = `Hi ${brand}! My name is ${form.name}.

Subject: ${form.subject}

Message: ${form.message}

Email: ${form.email}

Please get back to me at your earliest convenience!`;
    window.open(getWhatsAppLink(msg, settings.whatsappNumber), '_blank');
    setForm({ name: '', email: '', subject: '', message: '' });
    setFieldErrors({});
  };

  return (
    <div>
      <section className="page-header" style={{ backgroundImage: `url('/images/bg_3.jpg')` }}>
        <div className="hero-overlay"></div>
        <div className="container">
          <div className="page-header-content">
            <div className="breadcrumb">
              <Link to="/">Home</Link> <span>/</span> <span>Contact</span>
            </div>
            <h1>Contact Us</h1>
          </div>
        </div>
      </section>

      <section className="section" style={{ padding: '80px 0' }}>
        <div className="container">
          <div className="contact-grid">
            {/* Contact Info */}
            <div className="contact-info">
              <span className="subheading">Get In Touch</span>
              <h2>We'd Love To Hear From You</h2>
              <p>
                If you have any questions about car rentals, vehicle reservations, or fleet availability, 
                feel free to reach out. We respond within 2 minutes on WhatsApp!
              </p>

              <div className="contact-details">
                <div className="contact-item">
                  <div className="contact-icon"><FiMapPin /></div>
                  <div>
                    <h4>Address</h4>
                    <p>{settings.hubAddress || 'Connaught Place, New Delhi & Indiranagar, Bengaluru, India'}</p>
                  </div>
                </div>
                <div className="contact-item">
                  <div className="contact-icon"><FiPhone /></div>
                  <div>
                    <h4>Phone</h4>
                    <p>{settings.supportPhone || (settings.whatsappNumber ? `+${settings.whatsappNumber}` : '+91 73970 98447')}</p>
                  </div>
                </div>
                <div className="contact-item">
                  <div className="contact-icon"><FiMail /></div>
                  <div>
                    <h4>Email</h4>
                    <p>{settings.supportEmail || 'contact@carbookindia.com'}</p>
                  </div>
                </div>
                <div className="contact-item">
                  <div className="contact-icon"><FiClock /></div>
                  <div>
                    <h4>Working Hours</h4>
                    <p>{settings.operatingHours || 'Mon – Sat: 9:00 AM – 8:00 PM'}</p>
                  </div>
                </div>
              </div>

              <a
                href={getWhatsAppLink(`Hi ${settings?.businessName || 'A3 Car rental'}! I have a question.`, settings.whatsappNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp"
                style={{ marginTop: '20px', fontSize: '15px', padding: '12px 28px' }}
              >
                <FaWhatsapp size={18} /> Chat Directly on WhatsApp
              </a>

              {/* Social Channels - Enabled dynamically */}
              {(() => {
                const ig = (settings?.socialLinks?.instagram || settings?.instagramUrl || 'https://www.instagram.com/cabs_and_tyres?obrf=aHU4cnNnejljcGM5').trim();
                const fb = (settings?.socialLinks?.facebook || settings?.facebookUrl || '').trim();
                const tw = (settings?.socialLinks?.twitter || settings?.twitterUrl || '').trim();
                if (!ig && !fb && !tw) return null;

                return (
                  <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' }}>
                      Follow Our Channels
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      {ig && (
                        <a
                          href={ig}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Follow on Instagram"
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textDecoration: 'none',
                            boxShadow: '0 4px 10px rgba(225, 48, 108, 0.3)'
                          }}
                        >
                          <FaInstagram size={18} />
                        </a>
                      )}
                      {fb && (
                        <a
                          href={fb}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Connect on Facebook"
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            background: '#1877f2',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textDecoration: 'none',
                            boxShadow: '0 4px 10px rgba(24, 119, 242, 0.3)'
                          }}
                        >
                          <FaFacebook size={18} />
                        </a>
                      )}
                      {tw && (
                        <a
                          href={tw}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Follow on Twitter / X"
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            background: '#0f172a',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textDecoration: 'none',
                            boxShadow: '0 4px 10px rgba(15, 23, 42, 0.3)'
                          }}
                        >
                          <FaTwitter size={18} />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Contact Form */}
            <div className="contact-form-wrapper">
              <form onSubmit={handleSubmit} className="contact-form" noValidate>
                <div className="form-group">
                  <label>Your Name *</label>
                  <input
                    type="text"
                    placeholder="Full Name"
                    className={fieldErrors.name ? 'input-error' : ''}
                    value={form.name}
                    onChange={(e) => {
                      setForm({ ...form, name: e.target.value });
                      if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: '' }));
                    }}
                  />
                  {fieldErrors.name && <span className="field-error-text">{fieldErrors.name}</span>}
                </div>
                <div className="form-group">
                  <label>Your Email *</label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    className={fieldErrors.email ? 'input-error' : ''}
                    value={form.email}
                    onChange={(e) => {
                      setForm({ ...form, email: e.target.value });
                      if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' }));
                    }}
                  />
                  {fieldErrors.email && <span className="field-error-text">{fieldErrors.email}</span>}
                </div>
                <div className="form-group">
                  <label>Subject *</label>
                  <input
                    type="text"
                    placeholder="How can we help?"
                    className={fieldErrors.subject ? 'input-error' : ''}
                    value={form.subject}
                    onChange={(e) => {
                      setForm({ ...form, subject: e.target.value });
                      if (fieldErrors.subject) setFieldErrors(prev => ({ ...prev, subject: '' }));
                    }}
                  />
                  {fieldErrors.subject && <span className="field-error-text">{fieldErrors.subject}</span>}
                </div>
                <div className="form-group">
                  <label>Message *</label>
                  <textarea
                    rows="5"
                    placeholder="Tell us more about your inquiry..."
                    className={fieldErrors.message ? 'input-error' : ''}
                    value={form.message}
                    onChange={(e) => {
                      setForm({ ...form, message: e.target.value });
                      if (fieldErrors.message) setFieldErrors(prev => ({ ...prev, message: '' }));
                    }}
                  ></textarea>
                  {fieldErrors.message && <span className="field-error-text">{fieldErrors.message}</span>}
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Send via WhatsApp
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
