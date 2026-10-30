import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiCheck, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { 
  FaCar, FaAward, FaShieldAlt, FaHeadset, FaUserCheck, FaStar, 
  FaQuoteLeft, FaCheckCircle, FaGift, FaGoogle,
  FaUserTie, FaPhoneAlt,
  FaChevronDown, FaChevronUp, FaMapMarkerAlt,
  FaUsers, FaGasPump, FaCogs
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { getLandingReviews, getCars } from '../api';
import { formatDate } from '../utils/format';
import useSeo from '../hooks/useSeo';

const DEFAULT_FAQS = [
  {
    id: 'faq-1',
    question: 'Can I rent a car and also get an acting driver for that rented car?',
    answer: 'Yes, absolutely! You can choose either Self-Drive or book any car from our fleet with a verified, experienced acting driver. Our driver will handle traffic, navigation, and parking so you can travel in total comfort.'
  },
  {
    id: 'faq-2',
    question: 'What are the charges for renting a car with an acting driver?',
    answer: 'The car rental rate is based on the selected vehicle, and the professional driver charge is a transparent daily fee (typically ₹800–₹999/day or nominal trip fee) with zero hidden deductions.'
  },
  {
    id: 'faq-3',
    question: 'What documents are required to rent a self-drive car?',
    answer: 'For self-drive rentals, you need a valid Original Driving Licence (min 1 year old) and an Aadhaar card / Government Photo ID. If booking with our acting driver, only basic ID proof is required.'
  },
  {
    id: 'faq-4',
    question: 'Where can I pick up the car or meet the driver?',
    answer: 'You can pick up vehicles directly from our main hub at Kaliakkavillai (near Jayamatha Hospital, opposite Ration Shop) or request doorstep delivery across Marthandam, Nagercoil, and Trivandrum.'
  },
  {
    id: 'faq-5',
    question: 'Are your vehicles permitted for outstation and interstate travel?',
    answer: 'Yes! All vehicles have valid commercial tourist permits, comprehensive insurance, and interstate authorization for smooth travel across Tamil Nadu, Kerala, and all of South India.'
  }
];

export default function Home() {
  useSeo({
    title: 'Best Car Rental Service in Kaliakkavilai & Marthandam',
    description: 'A3 Car Rentals — Top-rated car rental & self-drive service in Kaliakkavilai, Marthandam, Parasala & Trivandrum. Book verified cars online from ₹1,200/day. Instant confirmation!',
    canonical: 'https://a3carrentals.in/',
    keywords: ['car rental Kaliakkavilai', 'self drive cars Marthandam', 'car booking Parasala', 'acting driver Kanyakumari', 'car hire Trivandrum', 'A3 Car Rental']
  });
  const { isAuthenticated } = useAuth();
  const { settings } = useSettings();
  const lp = settings?.landingPage || {};
  const offer = settings?.eventOffer;
  const [codeCopied, setCodeCopied] = useState(false);

  // Actual Fleet Cars State & Category Filter
  const [carsList, setCarsList] = useState([]);
  const [carsLoading, setCarsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // FAQs Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Reviews Slider State
  const [landingReviews, setLandingReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    fetchReviews();
    fetchFleetCars();
  }, []);

  const fetchFleetCars = async () => {
    try {
      setCarsLoading(true);
      const res = await getCars({ limit: 12 });
      const apiCars = res.data?.cars || (Array.isArray(res.data) ? res.data : []);
      setCarsList(apiCars);
    } catch (err) {
      console.warn('Failed to load fleet cars:', err);
      setCarsList([]);
    } finally {
      setCarsLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const res = await getLandingReviews();
      if (Array.isArray(res.data) && res.data.length > 0) {
        setLandingReviews(res.data);
      }
    } catch (err) {
      console.error('Failed to load landing reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  // Auto-play slider every 5 seconds
  useEffect(() => {
    if (isHovered || landingReviews.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % landingReviews.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isHovered, landingReviews.length]);

  const handlePrevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + landingReviews.length) % landingReviews.length);
  };

  const handleNextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % landingReviews.length);
  };

  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard?.writeText(code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2500);
  };

  const activeFaqs = Array.isArray(lp.faqs) && lp.faqs.length > 0 ? lp.faqs : DEFAULT_FAQS;

  // Extract dynamic categories from actual fleet cars
  const availableCategories = ['All', ...new Set(carsList.map(c => c.vehicleType).filter(Boolean))];

  const filteredCars = selectedCategory === 'All'
    ? carsList
    : carsList.filter(c => (c.vehicleType || '').toLowerCase() === selectedCategory.toLowerCase());

  const brandName = settings?.businessName || 'A3 Car rental';
  const phoneDisplay = settings?.supportPhone || '+91 73970 98447';
  const whatsappNumber = (settings?.whatsappNumber || '917397098447').replace(/[^0-9]/g, '');

  return (
    <div className="home-page">
      {/* 2. HERO BANNER */}
      <section 
        className="hero" 
        style={{ 
          backgroundImage: `url('${lp.heroBgImage || '/images/bg_1.jpg'}')`,
          padding: '110px 0 100px',
          minHeight: '78vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative'
        }}
      >
        <div className="hero-overlay"></div>
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div className="hero-content" style={{ textAlign: 'center', maxWidth: '840px', margin: '0 auto' }}>
            <span style={{ 
              display: 'inline-block', 
              padding: '6px 18px', 
              background: 'rgba(249, 109, 0, 0.25)', 
              color: '#ff9838', 
              borderRadius: '30px', 
              fontSize: '13px', 
              fontWeight: 800, 
              letterSpacing: '0.08em', 
              textTransform: 'uppercase', 
              marginBottom: '18px',
              border: '1px solid rgba(249, 109, 0, 0.4)'
            }}>
              {lp.heroBadge || '🚗 Self-Drive & Chauffeur Car Rentals in Kaliakkavilai'}
            </span>
            <h1 style={{ fontSize: 'clamp(32px, 5.5vw, 56px)', fontWeight: 900, color: '#fff', lineHeight: 1.15, margin: '0 0 18px' }}>
              {lp.heroTitle || 'Best Car Rental Service in Kaliakkavilai & Marthandam'}
            </h1>
            <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: '#e2e8f0', lineHeight: 1.6, margin: '0 auto 32px', maxWidth: '720px' }}>
              {lp.heroSubtitle || 'A3 Car Rentals provides verified luxury sedans, SUVs, and budget cars for Self-Drive or with Acting Drivers across Kaliakkavilai, Marthandam, Parasala, Kuzhithurai & Trivandrum. Instant online booking & doorstep delivery.'}
            </p>

            {/* Instant Sign Up & Action CTAs */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="btn btn-primary hero-btn"
                  style={{
                    padding: '15px 36px',
                    fontSize: '15px',
                    fontWeight: 800,
                    borderRadius: '12px',
                    boxShadow: '0 6px 22px rgba(249, 109, 0, 0.45)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <FaCar size={16} /> Explore Fleet &amp; Book
                </Link>
              ) : (
                <>
                  <Link
                    to="/signup"
                    className="btn btn-primary hero-btn"
                    style={{
                      padding: '15px 34px',
                      fontSize: '15px',
                      fontWeight: 800,
                      borderRadius: '12px',
                      boxShadow: '0 6px 22px rgba(249, 109, 0, 0.45)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    Sign Up to Book Car <FiArrowRight size={16} />
                  </Link>

                  <Link
                    to="/login"
                    className="btn btn-secondary hero-btn"
                    style={{
                      padding: '15px 30px',
                      fontSize: '15px',
                      fontWeight: 700,
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.15)',
                      borderColor: 'rgba(255, 255, 255, 0.35)',
                      color: '#ffffff',
                      backdropFilter: 'blur(6px)'
                    }}
                  >
                    Log In
                  </Link>

                  <a
                    href="#popular-cars"
                    style={{
                      padding: '14px 22px',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#cbd5e1',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    Browse Fleet ↓
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FESTIVE EVENT BANNER (IF ENABLED) */}
      {offer?.enabled && (
        <section className="section cb-event-offer-section" style={{ padding: '36px 0 10px' }}>
          <div className="container">
            <div 
              style={{
                position: 'relative',
                borderRadius: '20px',
                overflow: 'hidden',
                background: `linear-gradient(135deg, rgba(15, 23, 42, 0.94) 0%, rgba(15, 23, 42, 0.88) 100%), url('${offer.bannerImage || '/images/bg_2.jpg'}') center/cover no-repeat`,
                padding: '36px 32px',
                color: '#ffffff',
                boxShadow: '0 12px 36px -10px rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.12)'
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
                <div style={{ maxWidth: '640px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #f96d00, #ff8533)', color: '#fff', padding: '4px 12px', borderRadius: '30px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '12px' }}>
                    <FaGift size={12} /> {offer.badge || 'FESTIVE SPECIAL OFFER'}
                  </div>
                  <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 30px)', fontWeight: 900, margin: '0 0 10px', color: '#ffffff', lineHeight: 1.25 }}>
                    {offer.title || 'Special Mobility Offer'}
                  </h2>
                  <p style={{ fontSize: '14px', color: '#cbd5e1', margin: '0 0 16px', lineHeight: 1.5 }}>
                    {offer.description || 'Celebrate this season with premium luxury sedans and rugged SUVs. Enjoy exclusive flat discounts across all bookings!'}
                  </p>

                  {offer.promoCode && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px dashed rgba(255,255,255,0.3)', padding: '6px 14px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#cbd5e1' }}>Use Coupon:</span>
                      <strong style={{ fontSize: '15px', letterSpacing: '1px', color: '#fbbf24', fontFamily: 'monospace' }}>
                        {offer.promoCode}
                      </strong>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(offer.promoCode)}
                        style={{
                          background: codeCopied ? '#10b981' : '#ffffff',
                          color: codeCopied ? '#ffffff' : '#0f172a',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {codeCopied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  {offer.discountText && (
                    <div style={{ background: '#f96d00', color: '#ffffff', padding: '8px 20px', borderRadius: '30px', fontWeight: 900, fontSize: '16px', letterSpacing: '0.05em' }}>
                      {offer.discountText}
                    </div>
                  )}
                  <Link
                    to={offer.buttonLink || (isAuthenticated ? '/dashboard' : '/signup')}
                    className="btn btn-primary"
                    style={{ padding: '12px 24px', fontSize: '14px', fontWeight: 800 }}
                  >
                    {offer.buttonText || 'Claim Offer & Book'} <FiArrowRight />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. POPULAR CARS (FEATURED RENTAL FLEET) */}
      <section className="section" id="popular-cars" style={{ padding: '75px 0 65px' }}>
        <div className="container">
          <div className="section-header" style={{ textAlign: 'center', marginBottom: '36px' }}>
            <span className="subheading" style={{ color: '#f96d00', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '12px' }}>
              {lp.popularCarsSubheading || 'OUR FEATURED FLEET'}
            </span>
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 900, color: '#0f172a', marginTop: '6px', marginBottom: '8px' }}>
              {lp.popularCarsTitle || 'Available Rental Vehicles'}
            </h2>
            <p style={{ maxWidth: '640px', margin: '0 auto', color: '#64748b', fontSize: '14px' }}>
              {lp.popularCarsSubtitle || 'Verified, fully-insured fleet available for Self-Drive or with our Professional Acting Driver. Create an account to reserve instantly.'}
            </p>

            {/* Dynamic Category Filter Pills */}
            {availableCategories.length > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '22px' }}>
                {availableCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      background: selectedCategory === cat ? '#f96d00' : '#f1f5f9',
                      color: selectedCategory === cat ? '#fff' : '#475569',
                      border: 'none',
                      borderRadius: '20px',
                      padding: '6px 18px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {cat === 'All' ? 'All Vehicles' : cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cars Content: Loading / Empty / Grid */}
          {carsLoading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div className="spinner" style={{ width: '36px', height: '36px', margin: '0 auto' }}></div>
            </div>
          ) : filteredCars.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', maxWidth: '580px', margin: '0 auto' }}>
              <FaCar size={42} color="#cbd5e1" style={{ marginBottom: '14px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
                No vehicles listed in this category
              </h3>
              <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 18px' }}>
                Check back shortly or create your account to get notified when new cars are available.
              </p>
              <Link to={isAuthenticated ? '/dashboard' : '/signup'} className="btn btn-primary" style={{ padding: '10px 24px', fontSize: '13px', fontWeight: 700 }}>
                {isAuthenticated ? 'Go to Dashboard' : 'Sign Up Now'}
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '24px' }}>
              {filteredCars.map((car, idx) => {
                const carImg = car.images?.[0] || `/images/car-${(idx % 6) + 1}.jpg`;
                const brand = car.brand || 'Premium';
                const name = car.name || 'Rental Vehicle';
                const price = car.pricePerDay || 0;

                return (
                  <div
                    key={car._id || idx}
                    style={{
                      background: '#ffffff',
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
                      overflow: 'hidden',
                      boxShadow: '0 4px 18px rgba(0,0,0,0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                    }}
                  >
                    {/* Image with badges */}
                    <div style={{ position: 'relative', height: '190px', background: '#0f172a', overflow: 'hidden' }}>
                      <img
                        src={carImg}
                        alt={`${brand} ${name}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.src = '/images/car-1.jpg'; }}
                      />
                      <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(4px)', color: '#fff', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>
                        {car.vehicleType || 'Car'}
                      </div>

                      <div style={{ position: 'absolute', top: '12px', right: '12px', background: '#10b981', color: '#fff', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>
                        ★ Verified Fleet
                      </div>
                    </div>

                    {/* Body Content */}
                    <div style={{ padding: '18px 20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#f96d00', textTransform: 'uppercase', marginBottom: '2px' }}>
                          {brand}
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 12px' }}>
                          {name}
                        </h3>

                        {/* Specs Icons */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', padding: '10px 0', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', marginBottom: '14px', fontSize: '12px', color: '#64748b' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FaUsers size={12} color="#f96d00" /> {car.seats || 5} Seats
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FaCogs size={12} color="#f96d00" /> {car.transmission || 'Manual'}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FaGasPump size={12} color="#f96d00" /> {car.fuelType || 'Diesel'}
                          </div>
                        </div>
                      </div>

                      {/* Price and Instant Signup/Book Action */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>Rental Price:</span>
                          <div>
                            <strong style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a' }}>₹{price}</strong>
                            <span style={{ fontSize: '12px', color: '#64748b' }}> / day</span>
                          </div>
                        </div>

                        {/* Single Instant Action CTA */}
                        <Link
                          to={isAuthenticated ? '/dashboard' : '/signup'}
                          className="btn btn-primary"
                          style={{
                            width: '100%',
                            padding: '12px',
                            fontSize: '14px',
                            fontWeight: 800,
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            textDecoration: 'none',
                            boxShadow: '0 4px 14px rgba(249, 109, 0, 0.35)'
                          }}
                        >
                          {isAuthenticated ? 'Book This Vehicle' : 'Sign Up to Book'} <FiArrowRight size={14} />
                        </Link>

                        {!isAuthenticated && (
                          <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '11px', color: '#64748b' }}>
                            Already registered?{' '}
                            <Link to="/login" style={{ color: '#f96d00', fontWeight: 700, textDecoration: 'none' }}>
                              Log In
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '36px' }}>
            <Link
              to={isAuthenticated ? '/dashboard' : '/signup'}
              className="btn btn-primary"
              style={{ padding: '12px 32px', fontSize: '14px', fontWeight: 800, borderRadius: '10px' }}
            >
              {isAuthenticated ? 'Explore All Fleet in Dashboard' : 'Sign Up to View Full Fleet'} ({carsList.length} Available) <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. WHY CHOOSE US? */}
      <section className="section bg-light" style={{ padding: '75px 0' }}>
        <div className="container">
          <div className="section-header" style={{ textAlign: 'center', marginBottom: '45px' }}>
            <span className="subheading" style={{ color: '#f96d00', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '12px' }}>
              {lp.whyChooseSubheading || 'OUR COMMITMENT'}
            </span>
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 900, color: '#0f172a', marginTop: '6px', marginBottom: '8px' }}>
              {lp.whyChooseTitle || `Why Choose ${brandName}?`}
            </h2>
            <p style={{ maxWidth: '640px', margin: '0 auto', color: '#64748b', fontSize: '14px' }}>
              {lp.whyChooseSubtitle || 'Top-rated car rental and acting driver service across Kaliakkavillai, Kanyakumari, and Trivandrum.'}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {/* Feature 1: Car + Acting Driver */}
            <div style={{ background: '#fff', padding: '28px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(249, 109, 0, 0.12)', color: '#f96d00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '18px' }}>
                <FaUserTie />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
                {lp.whyFeature1Title || 'Car + Professional Acting Driver'}
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                {lp.whyFeature1Desc || 'Need someone else to drive? You can rent any car from our fleet with an experienced, polite, police-verified acting driver for local trips, weddings, or long highway journeys.'}
              </p>
            </div>

            {/* Feature 2: Transparent Pricing */}
            <div style={{ background: '#fff', padding: '28px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.12)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '18px' }}>
                <FaShieldAlt />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
                {lp.whyFeature2Title || 'Transparent Pricing & No Hidden Fees'}
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                {lp.whyFeature2Desc || 'Clear daily rental prices, transparent fuel terms, and zero unexpected security deposit deductions. What you see is what you pay.'}
              </p>
            </div>

            {/* Feature 3: Doorstep Delivery & Hub */}
            <div style={{ background: '#fff', padding: '28px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '18px' }}>
                <FaMapMarkerAlt />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
                {lp.whyFeature3Title || 'Local Hub & Doorstep Delivery'}
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                {lp.whyFeature3Desc || 'Convenient pickup right opposite the Ration shop near Jayamatha Hospital, Kaliakkavillai, or doorstep handover at your home, hotel, or airport.'}
              </p>
            </div>

            {/* Feature 4: Sanitized Vehicles */}
            <div style={{ background: '#fff', padding: '28px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(234, 179, 8, 0.12)', color: '#ca8a04', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '18px' }}>
                <FaCar />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
                {lp.whyFeature4Title || 'Clean, Sanitized & Maintained Fleet'}
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                {lp.whyFeature4Desc || 'Every vehicle is thoroughly vacuumed, washed, safety-checked, and highway-tested prior to handover for worry-free driving.'}
              </p>
            </div>

            {/* Feature 5: 24/7 Roadside Assistance */}
            <div style={{ background: '#fff', padding: '28px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '18px' }}>
                <FaHeadset />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
                {lp.whyFeature5Title || '24/7 Support & Roadside Help'}
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                {lp.whyFeature5Desc || 'Round-the-clock emergency assistance, tyre support, and phone concierge available across Tamil Nadu and Kerala.'}
              </p>
            </div>

            {/* Feature 6: Fast Online Account & Booking */}
            <div style={{ background: '#fff', padding: '28px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(249, 109, 0, 0.12)', color: '#f96d00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '18px' }}>
                <FaUserCheck />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
                {lp.whyFeature6Title || 'Instant Online Booking'}
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                {lp.whyFeature6Desc || 'Sign up in minutes to access our verified fleet, book self-drive or acting driver rides, and track reservations in real-time.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS */}
      <section className="section" style={{ padding: '75px 0' }}>
        <div className="container">
          <div className="section-header" style={{ textAlign: 'center', marginBottom: '45px' }}>
            <span className="subheading" style={{ color: '#f96d00', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '12px' }}>
              HOW IT WORKS
            </span>
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 900, color: '#0f172a', marginTop: '6px', marginBottom: '8px' }}>
              {lp.howItWorksTitle || 'Book Your Car in 3 Steps'}
            </h2>
            <p style={{ maxWidth: '640px', margin: '0 auto', color: '#64748b', fontSize: '14px' }}>
              {lp.howItWorksSubtitle || 'Simple, fast, and hassle-free car rental experience'}
            </p>
          </div>
          <div className="how-it-works-grid">
            <div className="hiw-card">
              <div className="hiw-number">01</div>
              <div className="hiw-icon"><FaUserCheck /></div>
              <h3>{lp.step1Title || 'Choose Car & Mode'}</h3>
              <p>{lp.step1Desc || 'Pick your preferred sedan, SUV, or luxury car, and select whether you want Self-Drive or Car with Acting Driver.'}</p>
            </div>
            <div className="hiw-card">
              <div className="hiw-number">02</div>
              <div className="hiw-icon"><FaCar /></div>
              <h3>{lp.step2Title || 'Pick Dates & Location'}</h3>
              <p>{lp.step2Desc || 'Select your journey dates. Choose hub pickup at Kaliakkavillai or request doorstep delivery.'}</p>
            </div>
            <div className="hiw-card">
              <div className="hiw-number">03</div>
              <div className="hiw-icon"><FaAward /></div>
              <h3>{lp.step3Title || 'Confirm & Hit the Road'}</h3>
              <p>{lp.step3Desc || 'Get instant confirmation via WhatsApp, pick up your keys or meet your driver, and enjoy your journey!'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CAR CATEGORIES */}
      <section className="section bg-light" style={{ padding: '75px 0' }}>
        <div className="container">
          <div className="section-header" style={{ textAlign: 'center', marginBottom: '45px' }}>
            <span className="subheading" style={{ color: '#f96d00', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '12px' }}>
              {lp.categoriesSubheading || 'BROWSE BY FLEET TYPE'}
            </span>
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 900, color: '#0f172a', marginTop: '6px', marginBottom: '8px' }}>
              {lp.categoriesTitle || 'Vehicle Categories'}
            </h2>
            <p style={{ maxWidth: '640px', margin: '0 auto', color: '#64748b', fontSize: '14px' }}>
              {lp.categoriesSubtitle || 'From compact city cars to spacious family MUVs and wedding luxury sedans — available with or without driver.'}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
            {/* Category 1: SUVs & MUVs */}
            <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
              <div style={{ height: '160px', background: '#0f172a', overflow: 'hidden' }}>
                <img src="/images/car-1.jpg" alt="SUVs and MUVs" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ padding: '20px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#f96d00', textTransform: 'uppercase' }}>
                  {lp.cat1Badge || '7-9 Seater Fleet'}
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '4px 0 6px' }}>
                  {lp.cat1Title || 'SUVs & Family MUVs'}
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, margin: '0 0 14px' }}>
                  {lp.cat1Desc || 'Toyota Innova Crysta, Fortuner, Thar & Scorpio. Ideal for outstation family trips and hill stations.'}
                </p>
                <a href="#popular-cars" onClick={() => setSelectedCategory('SUV')} style={{ color: '#f96d00', fontWeight: 700, fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  Explore SUVs <FiArrowRight size={12} />
                </a>
              </div>
            </div>

            {/* Category 2: Sedans */}
            <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
              <div style={{ height: '160px', background: '#0f172a', overflow: 'hidden' }}>
                <img src="/images/car-3.jpg" alt="Comfortable Sedans" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ padding: '20px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#f96d00', textTransform: 'uppercase' }}>
                  {lp.cat2Badge || '5 Seater Comfort'}
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '4px 0 6px' }}>
                  {lp.cat2Title || 'Sedans & Compacts'}
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, margin: '0 0 14px' }}>
                  {lp.cat2Desc || 'Swift Dzire, Honda City & Hyundai Verna. Smooth highway cruising with generous boot space.'}
                </p>
                <a href="#popular-cars" onClick={() => setSelectedCategory('Sedan')} style={{ color: '#f96d00', fontWeight: 700, fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  Explore Sedans <FiArrowRight size={12} />
                </a>
              </div>
            </div>

            {/* Category 3: Luxury & Wedding */}
            <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
              <div style={{ height: '160px', background: '#0f172a', overflow: 'hidden' }}>
                <img src="/images/car-6.jpg" alt="Luxury Wedding Cars" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ padding: '20px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#f96d00', textTransform: 'uppercase' }}>
                  {lp.cat3Badge || 'VIP & Ceremony'}
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '4px 0 6px' }}>
                  {lp.cat3Title || 'Luxury & Wedding Fleet'}
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, margin: '0 0 14px' }}>
                  {lp.cat3Desc || 'Mercedes-Benz, BMW & Audi with uniformed professional chauffeurs for grand wedding entrances.'}
                </p>
                <a href="#popular-cars" onClick={() => setSelectedCategory('Luxury')} style={{ color: '#f96d00', fontWeight: 700, fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  Explore Luxury <FiArrowRight size={12} />
                </a>
              </div>
            </div>

            {/* Category 4: Car + Acting Driver Spotlight */}
            <div style={{ background: '#0f172a', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', boxShadow: '0 6px 20px rgba(0,0,0,0.2)' }}>
              <div style={{ height: '160px', background: '#1e293b', overflow: 'hidden' }}>
                <img src="/images/car-2.jpg" alt="Car with Acting Driver" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0f172a 0%, transparent 80%)' }} />
              </div>
              <div style={{ padding: '20px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {lp.cat4Badge || '⭐ Chauffeur Included'}
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: '4px 0 6px' }}>
                  {lp.cat4Title || 'Any Car + Acting Driver'}
                </h3>
                <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5, margin: '0 0 14px' }}>
                  {lp.cat4Desc || 'Book any car with our experienced acting driver for stress-free travel, night driving, or outstation tours.'}
                </p>
                <Link
                  to={isAuthenticated ? '/dashboard' : '/signup'}
                  style={{ color: '#f96d00', fontWeight: 700, fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  Sign Up to Book with Driver <FiArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. ABOUT US / SERVICE LOCATIONS */}
      <section className="section" style={{ padding: '80px 0' }}>
        <div className="container">
          <div className="about-wrapper">
            <div 
              className="about-image" 
              style={{ backgroundImage: `url('${lp.aboutImage || '/images/about.jpg'}')` }}
            >
              <div className="about-badge">
                <span className="years">{lp.aboutBadgeYears || '10+'}</span>
                <span className="text">{lp.aboutBadgeText || 'Years of Excellence'}</span>
              </div>
            </div>
            <div className="about-content">
              <span className="subheading" style={{ color: '#f96d00', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '12px' }}>
                About {brandName}
              </span>
              <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 900, color: '#0f172a', margin: '6px 0 16px' }}>
                {lp.aboutTitle || 'Your Premium Mobility Partner'}
              </h2>
              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, marginBottom: '20px' }}>
                {lp.aboutDesc || 'We provide premium car rentals for all your driving requirements. Whether you need a self-drive SUV for a holiday or wish to rent any car with an experienced acting driver — CarBook has you covered.'}
              </p>

              {/* Highlights */}
              <ul className="about-list" style={{ marginBottom: '24px' }}>
                <li><FiCheck /> {lp.aboutFeature1 || 'Rent for self-drive or with a verified professional acting driver'}</li>
                <li><FiCheck /> {lp.aboutFeature2 || 'Over 50+ premium vehicles across sports, luxury, and SUV categories'}</li>
                <li><FiCheck /> {lp.aboutFeature3 || 'Easy online & WhatsApp booking with real-time availability'}</li>
                <li><FiCheck /> {lp.aboutFeature4 || 'Transparent pricing with zero hidden security deposit deductions'}</li>
              </ul>

              {/* Service Locations Box */}
              <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <FaMapMarkerAlt color="#f96d00" />
                  <strong style={{ fontSize: '13px', color: '#0f172a' }}>Our Hub &amp; Service Locations:</strong>
                </div>
                <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.6 }}>
                  📍 <strong>Main Hub:</strong> {lp.mainHubAddress || 'Opp. Ration Shop, Near Jayamatha Hospital, Kaliakkavillai, Panamkalai - 629153'}<br />
                  🚚 <strong>Delivery Coverage:</strong> {lp.deliveryCoverage || 'Marthandam • Nagercoil • Kanyakumari • Trivandrum (TRV) Airport • Kuzhithurai'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Link to="/about" className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '13px', fontWeight: 700, borderRadius: '8px' }}>
                  Learn More About Us
                </Link>
                <Link to="/about#company-map" className="btn btn-secondary" style={{ padding: '12px 20px', fontSize: '13px', fontWeight: 700, borderRadius: '8px', color: '#0f172a', borderColor: '#cbd5e1' }}>
                  View Map &amp; Directions
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. CUSTOMER REVIEWS (SLIDER WITH GOOGLE REVIEWS) */}
      <section className="section bg-light" style={{ padding: '80px 0', position: 'relative' }}>
        <div className="container">
          <div className="section-header" style={{ textAlign: 'center', marginBottom: '45px' }}>
            <span className="subheading" style={{ color: '#f96d00', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '12px' }}>
              VERIFIED CUSTOMER REVIEWS
            </span>
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 900, color: '#0f172a', marginTop: '6px', marginBottom: '8px' }}>
              {lp.reviewsTitle || 'What Our Renters Say'}
            </h2>
            <p style={{ maxWidth: '640px', margin: '0 auto', color: '#64748b', fontSize: '14px' }}>
              {lp.reviewsSubtitle || 'Authentic reviews and driving impressions from verified customers'}
            </p>
          </div>

          {reviewsLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div className="spinner" style={{ width: '32px', height: '32px', margin: '0 auto' }}></div>
            </div>
          ) : landingReviews.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>
              <p>No customer reviews featured on the homepage yet.</p>
            </div>
          ) : (
            <div 
              className="testimonials-carousel-container"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              style={{ position: 'relative', maxWidth: '820px', margin: '0 auto' }}
            >
              {(() => {
                const rev = landingReviews[currentSlide] || landingReviews[0];
                const reviewerName = rev.authorName || rev.user?.name || 'Verified Customer';
                const isGoogle = rev.source === 'google';
                const initials = reviewerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'CU';
                const car = rev.car || {};
                const carImg = car.images?.[0] || '/images/car-1.jpg';

                return (
                  <div
                    key={rev._id}
                    className="testimonial-slide-card"
                    style={{
                      background: '#ffffff',
                      borderRadius: '20px',
                      padding: '36px 44px',
                      boxShadow: '0 12px 35px rgba(0, 0, 0, 0.07)',
                      border: '1px solid #e2e8f0',
                      position: 'relative',
                      minHeight: '260px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {/* Top row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div 
                          style={{ 
                            width: '40px', 
                            height: '40px', 
                            borderRadius: '10px', 
                            background: isGoogle ? '#fef2f2' : '#fff7ed', 
                            color: isGoogle ? '#ea4335' : '#f96d00', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontSize: '18px'
                          }}
                        >
                          {isGoogle ? <FaGoogle /> : <FaQuoteLeft />}
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: isGoogle ? '#ea4335' : '#f96d00', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {isGoogle ? 'Verified Google Review' : 'Verified Rental Experience'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '3px', color: '#f59e0b' }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <FaStar key={s} size={16} color={s <= rev.rating ? '#f59e0b' : '#cbd5e1'} />
                        ))}
                      </div>
                    </div>

                    {/* Review Body */}
                    <div style={{ marginBottom: '22px' }}>
                      {rev.title && (
                        <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>
                          &ldquo;{rev.title}&rdquo;
                        </h3>
                      )}
                      <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: 1.7, fontStyle: 'italic' }}>
                        {rev.comment}
                      </p>
                    </div>

                    {/* Reviewer Details */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            background: isGoogle ? 'linear-gradient(135deg, #ea4335 0%, #fbbc05 100%)' : 'linear-gradient(135deg, #f96d00 0%, #ea580c 100%)',
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {initials}
                        </div>
                        <div>
                          <strong style={{ display: 'block', fontSize: '14px', color: '#0f172a' }}>{reviewerName}</strong>
                          {isGoogle ? (
                            <span style={{ fontSize: '11px', color: '#ea4335', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <FaGoogle size={10} /> Google Verified • {formatDate(rev.createdAt)}
                            </span>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <FaCheckCircle size={10} /> Verified Customer • {formatDate(rev.createdAt)}
                            </span>
                          )}
                        </div>
                      </div>

                      {car.name && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '5px 10px' }}>
                          <img
                            src={carImg}
                            alt={car.name}
                            style={{ width: '36px', height: '24px', objectFit: 'cover', borderRadius: '4px' }}
                            onError={(e) => { e.target.src = '/images/car-1.jpg'; }}
                          />
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{car.brand} {car.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Slider Arrows */}
              {landingReviews.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevSlide}
                    aria-label="Previous review"
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '-20px',
                      transform: 'translateY(-50%)',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#0f172a',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      zIndex: 2
                    }}
                  >
                    <FiChevronLeft size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={handleNextSlide}
                    aria-label="Next review"
                    style={{
                      position: 'absolute',
                      top: '50%',
                      right: '-20px',
                      transform: 'translateY(-50%)',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#0f172a',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      zIndex: 2
                    }}
                  >
                    <FiChevronRight size={18} />
                  </button>
                </>
              )}

              {/* Slider Dots */}
              {landingReviews.length > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '22px' }}>
                  {landingReviews.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentSlide(idx)}
                      aria-label={`Go to slide ${idx + 1}`}
                      style={{
                        width: currentSlide === idx ? '24px' : '8px',
                        height: '8px',
                        borderRadius: '6px',
                        background: currentSlide === idx ? '#f96d00' : '#cbd5e1',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        transition: 'all 0.2s ease'
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 9. FAQS (FREQUENTLY ASKED QUESTIONS - COLLAPSIBLE ACCORDION) */}
      <section className="section" style={{ padding: '80px 0' }}>
        <div className="container" style={{ maxWidth: '840px', margin: '0 auto' }}>
          <div className="section-header" style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span className="subheading" style={{ color: '#f96d00', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '12px' }}>
              COMMON QUESTIONS
            </span>
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 900, color: '#0f172a', marginTop: '6px', marginBottom: '8px' }}>
              {lp.faqsTitle || 'Frequently Asked Questions'}
            </h2>
            <p style={{ color: '#64748b', fontSize: '14px' }}>
              {lp.faqsSubtitle || 'Everything you need to know about renting a car and booking with a professional acting driver'}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activeFaqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={faq.id || idx}
                  style={{
                    background: '#ffffff',
                    borderRadius: '12px',
                    border: `1px solid ${isOpen ? '#f96d00' : '#e2e8f0'}`,
                    boxShadow: isOpen ? '0 4px 20px rgba(249, 109, 0, 0.08)' : '0 2px 6px rgba(0,0,0,0.02)',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                    style={{
                      width: '100%',
                      padding: '18px 22px',
                      background: isOpen ? '#fffaf5' : '#ffffff',
                      border: 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '16px',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <span style={{ fontSize: '15px', fontWeight: 800, color: isOpen ? '#f96d00' : '#0f172a' }}>
                      {faq.question}
                    </span>
                    <span style={{ color: isOpen ? '#f96d00' : '#64748b', flexShrink: 0 }}>
                      {isOpen ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
                    </span>
                  </button>

                  {isOpen && (
                    <div style={{ padding: '0 22px 18px', background: '#fffaf5', color: '#475569', fontSize: '14px', lineHeight: 1.65, borderTop: '1px solid rgba(249, 109, 0, 0.1)' }}>
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 10. PRE-FOOTER CONTACT & CTA BANNER */}
      <section 
        className="cta-section" 
        style={{ backgroundImage: `url('${lp.ctaBgImage || '/images/bg_3.jpg'}')`, padding: '80px 0' }}
      >
        <div className="hero-overlay"></div>
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div className="cta-content" style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto' }}>
            <span style={{ display: 'inline-block', padding: '4px 14px', background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: '20px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '14px' }}>
              {lp.ctaBadge || 'READY TO HIT THE ROAD?'}
            </span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, color: '#fff', margin: '0 0 14px' }}>
              {lp.ctaTitle || 'Rent Your Dream Car in Minutes'}
            </h2>
            <p style={{ fontSize: '15px', color: '#e2e8f0', margin: '0 0 28px', lineHeight: 1.6 }}>
              {lp.ctaDesc || 'Experience hassle-free mobility with verified cars and on-demand professional acting drivers. Reach out now on WhatsApp or call our hub directly.'}
            </p>

            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                to={isAuthenticated ? '/dashboard' : '/signup'}
                className="btn btn-primary"
                style={{
                  background: '#f96d00',
                  color: '#fff',
                  padding: '14px 34px',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 18px rgba(249, 109, 0, 0.4)'
                }}
              >
                <FaCar size={16} /> {lp.ctaButtonText || (isAuthenticated ? 'Explore Fleet & Book' : 'Sign Up Now to Book')}
              </Link>

              {!isAuthenticated ? (
                <Link
                  to="/login"
                  className="btn btn-secondary"
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    borderColor: '#ffffff',
                    color: '#ffffff',
                    padding: '14px 28px',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  Log In to Account
                </Link>
              ) : (
                <a
                  href={`tel:${phoneDisplay}`}
                  className="btn btn-secondary"
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    borderColor: '#ffffff',
                    color: '#ffffff',
                    padding: '14px 24px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <FaPhoneAlt size={14} /> Call {phoneDisplay}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
