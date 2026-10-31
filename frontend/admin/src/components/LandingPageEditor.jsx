import { useState, useEffect, useRef } from 'react';
import {
  FaSave, FaCheck, FaExclamationTriangle,
  FaExternalLinkAlt, FaUndo, FaBullhorn, FaListOl,
  FaInfoCircle, FaChartLine, FaCheckCircle, FaCar, FaStar,
  FaEye, FaEyeSlash, FaTrash, FaQuoteLeft, FaCommentDots,
  FaGift, FaMapMarkerAlt,
  FaInstagram, FaFacebook, FaTwitter,
  FaGoogle, FaPlus, FaTimes,
  FaUserTie, FaWhatsapp, FaPhoneAlt, FaRoad, FaClock, FaShieldAlt,
  FaQuestionCircle, FaChevronDown, FaChevronUp, FaEdit
} from 'react-icons/fa';
import { getSettings, updateLandingPage, updateEventOffer, getReviews, deleteReview, toggleReviewLanding, createAdminReview } from '../api';
import { formatDate } from '../utils/format';

const DEFAULT_LANDING_DATA = {
  heroBadge: '🚗 Self-Drive & Chauffeur Car Rentals',
  heroTitle: 'Fast & Easy Way To Rent A Car',
  heroSubtitle: 'Explore our curated fleet of luxury sedans, rugged SUVs, and high-performance supercars. Sign up or log in to browse, reserve, and manage your vehicle rentals seamlessly.',
  heroBgImage: '/images/bg_1.jpg',
  heroCtaText: 'Get Started',

  // Featured Fleet Section
  popularCarsSubheading: 'OUR FEATURED FLEET',
  popularCarsTitle: 'Available Rental Vehicles',
  popularCarsSubtitle: 'Verified, fully-insured fleet available for Self-Drive or with our Professional Acting Driver. Create an account to reserve instantly.',

  // Why Choose Us Section
  whyChooseSubheading: 'OUR COMMITMENT',
  whyChooseTitle: 'Why Choose A3 Car rental?',
  whyChooseSubtitle: 'Top-rated car rental and acting driver service across Kaliakkavillai, Kanyakumari, and Trivandrum.',
  whyFeature1Title: 'Car + Professional Acting Driver',
  whyFeature1Desc: 'Need someone else to drive? You can rent any car from our fleet with an experienced, polite, police-verified acting driver for local trips, weddings, or long highway journeys.',
  whyFeature2Title: 'Transparent Pricing & No Hidden Fees',
  whyFeature2Desc: 'Clear daily rental prices, transparent fuel terms, and zero unexpected security deposit deductions. What you see is what you pay.',
  whyFeature3Title: 'Local Hub & Doorstep Delivery',
  whyFeature3Desc: 'Convenient pickup right opposite the Ration shop near Jayamatha Hospital, Kaliakkavillai, or doorstep handover at your home, hotel, or airport.',
  whyFeature4Title: 'Clean, Sanitized & Maintained Fleet',
  whyFeature4Desc: 'Every vehicle is thoroughly vacuumed, washed, safety-checked, and highway-tested prior to handover for worry-free driving.',
  whyFeature5Title: '24/7 Support & Roadside Help',
  whyFeature5Desc: 'Round-the-clock emergency assistance, tyre support, and phone concierge available across Tamil Nadu and Kerala.',
  whyFeature6Title: 'Instant Online Booking',
  whyFeature6Desc: 'Sign up in minutes to access our verified fleet, book self-drive or acting driver rides, and track reservations in real-time.',

  howItWorksTitle: 'Book Your Car in 3 Steps',
  howItWorksSubtitle: 'Simple, fast, and hassle-free car rental experience',
  step1Title: 'Create Account',
  step1Desc: 'Sign up for free and get instant access to our premium fleet of vehicles.',
  step2Title: 'Choose Your Car',
  step2Desc: 'Browse available cars with real-time status. Pick the one that suits your needs.',
  step3Title: 'Book & Drive',
  step3Desc: 'Select your dates, confirm the booking, and hit the road. It\'s that simple!',

  // Vehicle Categories Section
  categoriesSubheading: 'BROWSE BY FLEET TYPE',
  categoriesTitle: 'Vehicle Categories',
  categoriesSubtitle: 'From compact city cars to spacious family MUVs and wedding luxury sedans — available with or without driver.',
  cat1Badge: '7-9 Seater Fleet',
  cat1Title: 'SUVs & Family MUVs',
  cat1Desc: 'Toyota Innova Crysta, Fortuner, Thar & Scorpio. Ideal for outstation family trips and hill stations.',
  cat2Badge: '5 Seater Comfort',
  cat2Title: 'Sedans & Compacts',
  cat2Desc: 'Swift Dzire, Honda City & Hyundai Verna. Smooth highway cruising with generous boot space.',
  cat3Badge: 'VIP & Ceremony',
  cat3Title: 'Luxury & Wedding Fleet',
  cat3Desc: 'Mercedes-Benz, BMW & Audi with uniformed professional chauffeurs for grand wedding entrances.',
  cat4Badge: '⭐ Chauffeur Included',
  cat4Title: 'Any Car + Acting Driver',
  cat4Desc: 'Book any car with our experienced acting driver for stress-free travel, night driving, or outstation tours.',

  aboutBadgeYears: '10+',
  aboutBadgeText: 'Years of Excellence',
  aboutTitle: 'Your Premium Mobility Partner',
  aboutDesc: 'We provide premium car rentals for all your driving requirements. Whether you need a sleek sports car for the weekend, a rugged SUV for an expedition, or a comfortable sedan for your daily commute — CarBook has you covered.',
  aboutFeature1: 'Rent for self-drive or with a verified professional acting driver',
  aboutFeature2: 'Over 50+ premium vehicles across sports, luxury, and SUV categories',
  aboutFeature3: 'Easy online booking with real-time availability',
  aboutFeature4: 'Transparent pricing with zero hidden security deposit deductions',
  aboutImage: '/images/about.jpg',
  mainHubAddress: 'Opp. Ration Shop, Near Jayamatha Hospital, Kaliakkavillai, Panamkalai - 629153',
  deliveryCoverage: 'Marthandam • Nagercoil • Kanyakumari • Trivandrum (TRV) Airport • Kuzhithurai',

  // Rent Car with Professional Acting Driver Section
  actingDriverEnabled: true,
  actingDriverBadge: 'RENT WITH VERIFIED DRIVER',
  actingDriverTitle: 'Rent Any Car with a Professional Acting Driver',
  actingDriverSubtitle: 'Sit back, relax, and let our verified professional drivers take the wheel. Choose any sedan, SUV, or luxury car from our fleet with a dedicated driver for local errands, weddings, outstation highway trips, or airport transfers.',
  actingDriverRate: 'Car Rental + Affordable Driver Daily Fee',
  actingDriverFeature1: 'All Fleet Cars Available with Driver',
  actingDriverFeature2: 'Local City & Long Distance Outstation',
  actingDriverFeature3: 'Police Verified, Polite & Experienced',
  actingDriverFeature4: 'Zero Driving Fatigue & Complete Safety',
  actingDriverCtaText: 'Book Car with Driver on WhatsApp',

  // FAQs Section (Admin Managed)
  faqsTitle: 'Frequently Asked Questions',
  faqsSubtitle: 'Everything you need to know about renting a car and booking with a professional acting driver',
  faqs: [
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
  ],

  // Company Location & Interactive Map Point
  companyLocation: 'Near by Jayamatha Hospital, Opp. Ration Shop, Kaliakkavillai, Panamkalai - 629153',
  companyMapQuery: 'A3 Car rental Kaliakkavillai panamkalai 629153',
  companyMapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15791.058512382906!2d77.15638885576467!3d8.326171267354821!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b05ab2e7848b5e1%3A0xbe02000328d9065!2sA3%20Car%20rental!5e0!3m2!1sen!2sin!4v1793281171962!5m2!1sen!2sin',
  companyLocationNotes: 'Near by Jayamatha Hospital, Landmark: Opposite Ration Shop',

  // Social Media Handles & URLs (Instagram default, FB & Twitter disabled by default)
  instagramUrl: 'https://www.instagram.com/cabs_and_tyres?obrf=aHU4cnNnejljcGM5',
  facebookUrl: '',
  twitterUrl: '',

  servicesTitle: 'What We Offer',
  servicesSubtitle: 'Tailored automotive services to cater to every occasion',

  reviewsTitle: 'What Our Renters Say',
  reviewsSubtitle: 'Authentic reviews and driving impressions from verified customers',

  stat1Number: '56+',
  stat1Label: 'Available Vehicles',
  stat2Number: '2,400+',
  stat2Label: 'Happy Customers',
  stat3Number: '100%',
  stat3Label: 'Satisfaction Rate',
  stat4Number: '24/7',
  stat4Label: 'Customer Support',

  ctaBadge: 'READY TO HIT THE ROAD?',
  ctaTitle: 'Ready to Hit the Road?',
  ctaDesc: 'Create your account now and start exploring our premium fleet. Book your dream car in minutes!',
  ctaButtonText: 'Sign Up Now to Book',
  ctaBgImage: '/images/bg_3.jpg'
};

const DEFAULT_EVENT_OFFER = {
  enabled: true,
  badge: 'FESTIVE SPECIAL OFFER',
  title: 'Diwali Festive Mobility Sale 2026',
  description: 'Celebrate this season with premium luxury sedans and rugged SUVs. Enjoy flat 25% off across all bookings with complimentary chauffeur service on select routes!',
  promoCode: 'DIWALI25',
  discountText: 'FLAT 25% OFF',
  bannerImage: '/images/bg_2.jpg',
  buttonText: 'Claim Offer & Book Now',
  buttonLink: '/dashboard'
};

export default function LandingPageEditor() {
  const [formData, setFormData] = useState(DEFAULT_LANDING_DATA);
  const [eventOfferData, setEventOfferData] = useState(DEFAULT_EVENT_OFFER);
  const [activeSection, setActiveSection] = useState('hero');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  // Reviews Moderation State
  const [customerReviews, setCustomerReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  // Add Google Review / Custom Review State
  const [showAddReviewModal, setShowAddReviewModal] = useState(false);
  const [newReview, setNewReview] = useState({
    authorName: '',
    rating: 5,
    title: '',
    comment: '',
    source: 'google',
    showOnLanding: true
  });
  const [addingReview, setAddingReview] = useState(false);

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!newReview.authorName.trim()) {
      alert('Please enter reviewer name (e.g. from Google Reviews)');
      return;
    }
    if (!newReview.comment.trim()) {
      alert('Please enter review comment/message');
      return;
    }
    setAddingReview(true);
    try {
      const res = await createAdminReview(newReview);
      if (res.data) {
        setCustomerReviews(prev => [res.data, ...prev]);
        setShowAddReviewModal(false);
        setNewReview({
          authorName: '',
          rating: 5,
          title: '',
          comment: '',
          source: 'google',
          showOnLanding: true
        });
        setStatusMsg({
          type: 'success',
          text: `✅ Google Review by "${res.data.authorName}" added successfully and featured on homepage!`
        });
        setTimeout(() => setStatusMsg({ type: '', text: '' }), 5000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add review');
    } finally {
      setAddingReview(false);
    }
  };

  // FAQ Management State
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [editingFaqId, setEditingFaqId] = useState(null);
  const [faqForm, setFaqForm] = useState({ question: '', answer: '' });
  const [expandedFaqPreview, setExpandedFaqPreview] = useState(null);

  const handleOpenAddFaq = () => {
    setEditingFaqId(null);
    setFaqForm({ question: '', answer: '' });
    setShowFaqModal(true);
  };

  const handleOpenEditFaq = (faq) => {
    setEditingFaqId(faq.id);
    setFaqForm({ question: faq.question, answer: faq.answer });
    setShowFaqModal(true);
  };

  const handleSaveFaq = (e) => {
    e.preventDefault();
    if (!faqForm.question.trim() || !faqForm.answer.trim()) {
      alert('Please enter both question and answer.');
      return;
    }
    if (editingFaqId) {
      setFormData(prev => ({
        ...prev,
        faqs: (prev.faqs || []).map(f => f.id === editingFaqId ? { ...f, question: faqForm.question.trim(), answer: faqForm.answer.trim() } : f)
      }));
    } else {
      const newFaq = {
        id: 'faq-' + Date.now(),
        question: faqForm.question.trim(),
        answer: faqForm.answer.trim()
      };
      setFormData(prev => ({
        ...prev,
        faqs: [...(prev.faqs || []), newFaq]
      }));
    }
    setShowFaqModal(false);
    setFaqForm({ question: '', answer: '' });
    setEditingFaqId(null);
  };

  const handleDeleteFaq = (id) => {
    if (!window.confirm('Are you sure you want to delete this FAQ question?')) return;
    setFormData(prev => ({
      ...prev,
      faqs: (prev.faqs || []).filter(f => f.id !== id)
    }));
  };

  useEffect(() => {
    loadSettings();
    loadReviews();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await getSettings();
      if (res.data) {
        const lp = res.data.landingPage || {};
        const sl = res.data.socialLinks || {};
        setFormData(prev => ({
          ...prev,
          ...lp,
          faqs: Array.isArray(lp.faqs) && lp.faqs.length > 0 ? lp.faqs : prev.faqs,
          instagramUrl: lp.instagramUrl !== undefined ? lp.instagramUrl : (sl.instagram || res.data.instagramUrl || prev.instagramUrl),
          facebookUrl: lp.facebookUrl !== undefined ? lp.facebookUrl : (sl.facebook || res.data.facebookUrl || ''),
          twitterUrl: lp.twitterUrl !== undefined ? lp.twitterUrl : (sl.twitter || res.data.twitterUrl || '')
        }));
      }
      if (res.data?.eventOffer) {
        setEventOfferData(prev => ({
          ...prev,
          ...res.data.eventOffer
        }));
      }
    } catch (err) {
      console.error('Failed to load landing page settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      setReviewsLoading(true);
      const res = await getReviews({ targetType: 'car', limit: 50 });
      if (Array.isArray(res.data?.reviews)) {
        setCustomerReviews(res.data.reviews);
      }
    } catch (err) {
      console.error('Failed to load reviews for moderation:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleEventOfferChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEventOfferData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setStatusMsg({ type: '', text: '' });
    try {
      const p1 = updateLandingPage(formData);
      const p2 = updateEventOffer(eventOfferData);
      const [res1, res2] = await Promise.all([p1, p2]);
      if (res1.data) {
        setFormData(prev => ({ ...prev, ...res1.data }));
      }
      if (res2.data) {
        setEventOfferData(prev => ({ ...prev, ...res2.data }));
      }
      try {
        window.dispatchEvent(new CustomEvent('settingsUpdated'));
      } catch (e) { }
      setStatusMsg({ type: 'success', text: '✅ Landing page contents & Event Offer poster updated live! Customer site reflects all changes immediately.' });
      setTimeout(() => setStatusMsg({ type: '', text: '' }), 5000);
    } catch (err) {
      console.error('Error saving landing page / offer poster:', err);
      setStatusMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save changes' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleLanding = async (review) => {
    const targetStatus = !review.showOnLanding;
    setTogglingId(review._id);
    try {
      await toggleReviewLanding(review._id, targetStatus);
      setCustomerReviews(prev =>
        prev.map(r => r._id === review._id ? { ...r, showOnLanding: targetStatus } : r)
      );
      setStatusMsg({
        type: 'success',
        text: targetStatus
          ? `✅ "${review.title || 'Review'}" is now featured on the homepage slider!`
          : `ℹ️ "${review.title || 'Review'}" has been hidden from the homepage slider.`
      });
      setTimeout(() => setStatusMsg({ type: '', text: '' }), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update review status');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to permanently delete this customer review?')) return;
    try {
      await deleteReview(reviewId);
      setCustomerReviews(prev => prev.filter(r => r._id !== reviewId));
      setStatusMsg({ type: 'success', text: 'Review removed successfully.' });
      setTimeout(() => setStatusMsg({ type: '', text: '' }), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete review');
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all landing page text to system factory defaults?')) {
      setFormData(DEFAULT_LANDING_DATA);
    }
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
      </div>
    );
  }

  const sections = [
    { id: 'hero', label: 'Hero Banner', icon: <FaBullhorn /> },
    { id: 'offer', label: 'Event Offer Poster', icon: <FaGift /> },
    { id: 'fleet', label: 'Featured Fleet Header', icon: <FaCar /> },
    { id: 'whyChoose', label: 'Why Choose Us (6 Features)', icon: <FaShieldAlt /> },
    { id: 'steps', label: '3-Step Process', icon: <FaListOl /> },
    { id: 'categories', label: 'Vehicle Categories (4 Spotlights)', icon: <FaCar /> },
    { id: 'about', label: 'About & Locations', icon: <FaInfoCircle /> },
    { id: 'actingDriver', label: 'Car + Acting Driver', icon: <FaUserTie /> },
    { id: 'location', label: 'Company Location & Map', icon: <FaMapMarkerAlt /> },
    { id: 'social', label: 'Social Channels (Instagram, FB, X)', icon: <FaInstagram /> },
    { id: 'reviews', label: `Reviews & Slider (${customerReviews.filter(r => r.showOnLanding).length} Active)`, icon: <FaStar /> },
    { id: 'faqs', label: `FAQs Accordion (${(formData.faqs || []).length})`, icon: <FaQuestionCircle /> },
    { id: 'stats', label: 'Statistics Counters', icon: <FaChartLine /> },
    { id: 'cta', label: 'Services & Bottom CTA', icon: <FaCar /> }
  ];

  const featuredOnLandingCount = customerReviews.filter(r => r.showOnLanding).length;
  const hiddenReviewsCount = customerReviews.length - featuredOnLandingCount;

  return (
    <div className="landing-editor-root" style={{ padding: '0 0 40px' }}>
      {/* Header Bar */}
      <div className="module-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
            Landing Page CMS &amp; Content Editor
          </h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
            Directly update marketing copy, hero banners, customer testimonials slider, and statistics on your public rental homepage.
          </p>
        </div>
        <div className="landing-editor-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <a
            href="http://localhost:5175"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-admin-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#f1f5f9', color: '#0f172a', borderRadius: '8px', fontWeight: 600, fontSize: '13px', textDecoration: 'none', border: '1px solid #cbd5e1' }}
          >
            <FaExternalLinkAlt size={12} /> View Customer Website
          </a>
          <button
            type="button"
            onClick={handleResetDefaults}
            style={{ padding: '10px 14px', background: '#fff', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            title="Reset form fields to factory default text"
          >
            <FaUndo size={12} /> Reset Defaults
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-admin-primary"
            style={{ padding: '10px 22px', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700 }}
          >
            <FaSave /> {saving ? 'Publishing Changes...' : 'Save & Publish Live'}
          </button>
        </div>
      </div>

      {statusMsg.text && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '10px',
            marginBottom: '20px',
            fontSize: '14px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: statusMsg.type === 'success' ? '#ecfdf5' : '#fef2f2',
            color: statusMsg.type === 'success' ? '#065f46' : '#991b1b',
            border: statusMsg.type === 'success' ? '1px solid #a7f3d0' : '1px solid #fecaca'
          }}
        >
          {statusMsg.type === 'success' ? <FaCheckCircle size={18} /> : <FaExclamationTriangle size={18} />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Editor Sub-Navigation Tabs - Scrollable with No Line Breaks */}
      <div
        className="editor-subnav-tabs"
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '2px solid #e2e8f0',
          marginBottom: '24px',
          overflowX: 'auto',
          overflowY: 'hidden',
          whiteSpace: 'nowrap',
          flexWrap: 'nowrap',
          paddingBottom: '2px',
          scrollbarWidth: 'thin',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {sections.map(sec => (
          <button
            key={sec.id}
            type="button"
            onClick={() => setActiveSection(sec.id)}
            style={{
              padding: '11px 20px',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              borderBottom: activeSection === sec.id ? '3px solid #f96d00' : '3px solid transparent',
              background: activeSection === sec.id ? '#fff' : 'transparent',
              color: activeSection === sec.id ? '#f96d00' : '#64748b',
              fontWeight: activeSection === sec.id ? 700 : 600,
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'all 0.15s ease'
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>{sec.icon}</span>
            <span style={{ whiteSpace: 'nowrap' }}>{sec.label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSave}>
        {/* SECTION 1: HERO BANNER */}
        {activeSection === 'hero' && (
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
              🌟 Hero Banner Section
            </h3>
            <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: '13px' }}>
              The first full-screen headline, subtitle, and primary call-to-action button visitors see when opening CarBook.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Main Hero Headline *
                </label>
                <input
                  type="text"
                  name="heroTitle"
                  value={formData.heroTitle}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Fast & Easy Way To Rent A Car"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Hero Subtitle Paragraph *
                </label>
                <textarea
                  rows={3}
                  name="heroSubtitle"
                  value={formData.heroSubtitle}
                  onChange={handleChange}
                  required
                  placeholder="Supporting elevator pitch and fleet overview..."
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Hero Top Pill Badge
                  </label>
                  <input
                    type="text"
                    name="heroBadge"
                    value={formData.heroBadge || ''}
                    onChange={handleChange}
                    placeholder="e.g. 🚗 Self-Drive & Chauffeur Car Rentals"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Primary CTA Button Text
                  </label>
                  <input
                    type="text"
                    name="heroCtaText"
                    value={formData.heroCtaText}
                    onChange={handleChange}
                    placeholder="e.g. Sign Up to Book Car"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION: EVENT TIME OFFER POSTER */}
        {activeSection === 'offer' && (
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  🎉 Event / Festival Offer Poster &amp; Announcement
                </h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                  Post customized promotional banners (e.g. Diwali Sale, Holiday Discounts, Weekend Specials) to the user landing page with 1-click control.
                </p>
              </div>

              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: eventOfferData.enabled ? '#ecfdf5' : '#f8fafc', padding: '8px 16px', borderRadius: '10px', border: `1px solid ${eventOfferData.enabled ? '#a7f3d0' : '#e2e8f0'}`, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="enabled"
                  checked={eventOfferData.enabled}
                  onChange={handleEventOfferChange}
                  style={{ width: '18px', height: '18px', accentColor: '#10b981' }}
                />
                <span style={{ fontSize: '13px', fontWeight: 700, color: eventOfferData.enabled ? '#065f46' : '#64748b' }}>
                  {eventOfferData.enabled ? '🟢 Poster Active & Published' : '⚪ Poster Disabled / Hidden'}
                </span>
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Festival / Event Badge Text
                </label>
                <input
                  type="text"
                  name="badge"
                  value={eventOfferData.badge}
                  onChange={handleEventOfferChange}
                  placeholder="e.g. FESTIVE SPECIAL OFFER or DIWALI DHAMAKA"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Discount Tag / Highlight
                </label>
                <input
                  type="text"
                  name="discountText"
                  value={eventOfferData.discountText}
                  onChange={handleEventOfferChange}
                  placeholder="e.g. FLAT 25% OFF or SAVE UP TO ₹5,000"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Promo Coupon Code
                </label>
                <input
                  type="text"
                  name="promoCode"
                  value={eventOfferData.promoCode}
                  onChange={handleEventOfferChange}
                  placeholder="e.g. DIWALI25, FESTIVE2026"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', fontWeight: 700, letterSpacing: '1px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Action Button Text
                </label>
                <input
                  type="text"
                  name="buttonText"
                  value={eventOfferData.buttonText}
                  onChange={handleEventOfferChange}
                  placeholder="Claim Offer & Book Now"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Main Offer Title / Headline
              </label>
              <input
                type="text"
                name="title"
                value={eventOfferData.title}
                onChange={handleEventOfferChange}
                placeholder="e.g. Diwali Festive Mobility Sale — Travel in Absolute Luxury"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 600, boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Offer Description / Details
              </label>
              <textarea
                rows={3}
                name="description"
                value={eventOfferData.description}
                onChange={handleEventOfferChange}
                placeholder="Celebrate this season with premium luxury sedans and rugged SUVs. Enjoy flat 25% off across all bookings..."
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Button Destination Link
              </label>
              <input
                type="text"
                name="buttonLink"
                value={eventOfferData.buttonLink}
                onChange={handleEventOfferChange}
                placeholder="/dashboard or /cars"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>

            {/* LIVE PREVIEW OF EVENT OFFER POSTER */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#f96d00', marginBottom: '10px' }}>
                👁️ Live Customer Homepage Poster Preview
              </div>
              <div style={{
                position: 'relative',
                borderRadius: '16px',
                overflow: 'hidden',
                background: `linear-gradient(rgba(15, 23, 42, 0.88), rgba(15, 23, 42, 0.88)), url('${eventOfferData.bannerImage || '/images/bg_2.jpg'}') center/cover no-repeat`,
                padding: '36px 32px',
                color: '#fff',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '24px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ maxWidth: '600px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #f96d00, #ff8533)', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em', marginBottom: '12px', textTransform: 'uppercase' }}>
                    <FaGift size={12} /> {eventOfferData.badge || 'SPECIAL OFFER'}
                  </div>
                  <h3 style={{ fontSize: '24px', fontWeight: 900, margin: '0 0 10px', color: '#fff', lineHeight: 1.25 }}>
                    {eventOfferData.title || 'Special Festive Mobility Discount'}
                  </h3>
                  <p style={{ fontSize: '14px', color: '#cbd5e1', margin: '0 0 16px', lineHeight: 1.5 }}>
                    {eventOfferData.description || 'Celebrate with premium luxury sedans and SUVs at exclusive discounted rates.'}
                  </p>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px dashed rgba(255,255,255,0.3)', padding: '6px 14px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#cbd5e1' }}>Use Promo Code:</span>
                    <strong style={{ fontSize: '14px', letterSpacing: '1px', color: '#fbbf24' }}>{eventOfferData.promoCode || 'DIWALI25'}</strong>
                  </div>
                </div>

                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <div style={{ background: '#f96d00', color: '#fff', padding: '8px 20px', borderRadius: '30px', fontWeight: 900, fontSize: '16px', letterSpacing: '0.05em', boxShadow: '0 4px 14px rgba(249, 109, 0, 0.4)' }}>
                    {eventOfferData.discountText || 'FLAT 25% OFF'}
                  </div>
                  <button type="button" style={{ background: '#fff', color: '#0f172a', border: 'none', borderRadius: '8px', padding: '12px 24px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                    {eventOfferData.buttonText || 'Claim Offer & Book Now'}
                  </button>
                  <small style={{ color: '#94a3b8', fontSize: '11px' }}>Limited time seasonal offer</small>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION: FEATURED FLEET HEADER */}
        {activeSection === 'fleet' && (
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
              🚗 Available Vehicles &amp; Featured Fleet Header
            </h3>
            <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: '13px' }}>
              Manage the section title, subheading tag, and descriptive intro above the real vehicle cards on the homepage.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Section Subheading Tag
                </label>
                <input
                  type="text"
                  name="popularCarsSubheading"
                  value={formData.popularCarsSubheading || ''}
                  onChange={handleChange}
                  placeholder="e.g. OUR FEATURED FLEET"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Main Fleet Title *
                </label>
                <input
                  type="text"
                  name="popularCarsTitle"
                  value={formData.popularCarsTitle || ''}
                  onChange={handleChange}
                  placeholder="e.g. Available Rental Vehicles"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 700, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Section Subtitle / Description
                </label>
                <textarea
                  rows={3}
                  name="popularCarsSubtitle"
                  value={formData.popularCarsSubtitle || ''}
                  onChange={handleChange}
                  placeholder="Verified, fully-insured fleet available for Self-Drive or with our Professional Acting Driver..."
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12.5px', color: '#475569' }}>
                💡 <strong>Fleet Listing Note:</strong> The vehicle cards shown below this header on the homepage automatically mirror the actual cars configured in your <strong>Vehicle Inventory</strong>.
              </div>
            </div>
          </div>
        )}

        {/* SECTION: WHY CHOOSE US */}
        {activeSection === 'whyChoose' && (
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
              🛡️ Why Choose Us (6 Feature Cards)
            </h3>
            <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: '13px' }}>
              Highlight your service benefits such as professional acting drivers, transparent pricing, doorstep delivery, sanitized cars, 24/7 help, and instant booking.
            </p>

            {/* Header copy */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '24px', background: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Section Subheading Tag
                </label>
                <input
                  type="text"
                  name="whyChooseSubheading"
                  value={formData.whyChooseSubheading || ''}
                  onChange={handleChange}
                  placeholder="e.g. OUR COMMITMENT"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Section Title
                </label>
                <input
                  type="text"
                  name="whyChooseTitle"
                  value={formData.whyChooseTitle || ''}
                  onChange={handleChange}
                  placeholder="e.g. Why Choose A3 Car rental?"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 700, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Section Subtitle
                </label>
                <input
                  type="text"
                  name="whyChooseSubtitle"
                  value={formData.whyChooseSubtitle || ''}
                  onChange={handleChange}
                  placeholder="Top-rated car rental and acting driver service..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* 6 Feature Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <div key={num} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#f96d00', marginBottom: '8px', textTransform: 'uppercase' }}>
                    Feature Card {num}
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Card Title
                    </label>
                    <input
                      type="text"
                      name={`whyFeature${num}Title`}
                      value={formData[`whyFeature${num}Title`] || ''}
                      onChange={handleChange}
                      placeholder={`Feature ${num} title`}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 700, boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Card Description
                    </label>
                    <textarea
                      rows={3}
                      name={`whyFeature${num}Desc`}
                      value={formData[`whyFeature${num}Desc`] || ''}
                      onChange={handleChange}
                      placeholder={`Feature ${num} description...`}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 2: HOW IT WORKS (3 STEPS) */}
        {activeSection === 'steps' && (
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
              🔢 How It Works — 3 Simple Steps
            </h3>
            <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: '13px' }}>
              Guide prospective renters on how quickly they can register, select, and book a car.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Section Heading
                </label>
                <input
                  type="text"
                  name="howItWorksTitle"
                  value={formData.howItWorksTitle}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Section Subheading
                </label>
                <input
                  type="text"
                  name="howItWorksSubtitle"
                  value={formData.howItWorksSubtitle}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
              {/* Step 1 */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#f96d00', display: 'block', marginBottom: '8px' }}>
                  STEP 01
                </span>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Title</label>
                  <input
                    type="text"
                    name="step1Title"
                    value={formData.step1Title}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Description</label>
                  <textarea
                    rows={2}
                    name="step1Desc"
                    value={formData.step1Desc}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  />
                </div>
              </div>

              {/* Step 2 */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#f96d00', display: 'block', marginBottom: '8px' }}>
                  STEP 02
                </span>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Title</label>
                  <input
                    type="text"
                    name="step2Title"
                    value={formData.step2Title}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Description</label>
                  <textarea
                    rows={2}
                    name="step2Desc"
                    value={formData.step2Desc}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  />
                </div>
              </div>

              {/* Step 3 */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#f96d00', display: 'block', marginBottom: '8px' }}>
                  STEP 03
                </span>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Title</label>
                  <input
                    type="text"
                    name="step3Title"
                    value={formData.step3Title}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Description</label>
                  <textarea
                    rows={2}
                    name="step3Desc"
                    value={formData.step3Desc}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION: VEHICLE CATEGORIES */}
        {activeSection === 'categories' && (
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
              🚗 Vehicle Categories &amp; Fleet Spotlights (4 Categories)
            </h3>
            <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: '13px' }}>
              Showcase the 4 primary vehicle types available for self-drive or with professional acting driver (SUVs, Sedans, Luxury Wedding, Acting Driver).
            </p>

            {/* Header titles */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '24px', background: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Section Subheading Tag
                </label>
                <input
                  type="text"
                  name="categoriesSubheading"
                  value={formData.categoriesSubheading || ''}
                  onChange={handleChange}
                  placeholder="e.g. BROWSE BY FLEET TYPE"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Main Section Title
                </label>
                <input
                  type="text"
                  name="categoriesTitle"
                  value={formData.categoriesTitle || ''}
                  onChange={handleChange}
                  placeholder="e.g. Vehicle Categories"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 700, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Section Subtitle / Description
                </label>
                <input
                  type="text"
                  name="categoriesSubtitle"
                  value={formData.categoriesSubtitle || ''}
                  onChange={handleChange}
                  placeholder="From compact city cars to spacious family MUVs and wedding luxury sedans..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* 4 Category Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
              {[1, 2, 3, 4].map((num) => (
                <div key={num} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#f96d00', marginBottom: '10px', textTransform: 'uppercase' }}>
                    Category Spotlight {num}
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Badge Tag (e.g. 7-9 Seater Fleet)
                    </label>
                    <input
                      type="text"
                      name={`cat${num}Badge`}
                      value={formData[`cat${num}Badge`] || ''}
                      onChange={handleChange}
                      placeholder={`Category ${num} badge`}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Category Title
                    </label>
                    <input
                      type="text"
                      name={`cat${num}Title`}
                      value={formData[`cat${num}Title`] || ''}
                      onChange={handleChange}
                      placeholder={`Category ${num} title`}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 700, boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Description &amp; Vehicle Examples
                    </label>
                    <textarea
                      rows={3}
                      name={`cat${num}Desc`}
                      value={formData[`cat${num}Desc`] || ''}
                      onChange={handleChange}
                      placeholder={`Category ${num} description...`}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 3: ABOUT US & KEY FEATURES */}
        {activeSection === 'about' && (
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
              🏢 About CarBook &amp; Trust Features
            </h3>
            <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: '13px' }}>
              Highlights your company history, credibility badge, and core service guarantees.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Badge Highlight (e.g. 10+)
                </label>
                <input
                  type="text"
                  name="aboutBadgeYears"
                  value={formData.aboutBadgeYears}
                  onChange={handleChange}
                  placeholder="10+"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Badge Caption
                </label>
                <input
                  type="text"
                  name="aboutBadgeText"
                  value={formData.aboutBadgeText}
                  onChange={handleChange}
                  placeholder="Years of Excellence"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                About Section Heading
              </label>
              <input
                type="text"
                name="aboutTitle"
                value={formData.aboutTitle}
                onChange={handleChange}
                placeholder="Your Premium Mobility Partner"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Main About Story Description
              </label>
              <textarea
                rows={3}
                name="aboutDesc"
                value={formData.aboutDesc}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </div>

            <h4 style={{ margin: '16px 0 10px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
              Checkmark Highlights (4 Bullet Points)
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Feature 1</label>
                <input
                  type="text"
                  name="aboutFeature1"
                  value={formData.aboutFeature1}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Feature 2</label>
                <input
                  type="text"
                  name="aboutFeature2"
                  value={formData.aboutFeature2}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Feature 3</label>
                <input
                  type="text"
                  name="aboutFeature3"
                  value={formData.aboutFeature3}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Feature 4</label>
                <input
                  type="text"
                  name="aboutFeature4"
                  value={formData.aboutFeature4}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Quick Company Location Configuration */}
            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <FaMapMarkerAlt style={{ color: 'var(--primary, #f96d00)' }} />
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                  Company Location on Map (Point in Map)
                </h4>
              </div>
              <p style={{ margin: '0 0 14px', fontSize: '12px', color: '#64748b' }}>
                Set the physical address and search query. The interactive map on the customer About page will pinpoint this exact location.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Company Address
                  </label>
                  <input
                    type="text"
                    name="companyLocation"
                    value={formData.companyLocation || ''}
                    onChange={handleChange}
                    placeholder="Connaught Place, Inner Circle, New Delhi 110001"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Map Pin Point Query / Coordinates
                  </label>
                  <input
                    type="text"
                    name="companyMapQuery"
                    value={formData.companyMapQuery || ''}
                    onChange={handleChange}
                    placeholder="Connaught Place, New Delhi, India"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>

            {/* Main Hub Address & Delivery Coverage Locations */}
            <div style={{ marginTop: '20px', paddingTop: '18px', borderTop: '1px solid #f1f5f9' }}>
              <h4 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                📍 Main Hub Address &amp; Delivery Coverage Areas
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Main Hub Address
                  </label>
                  <input
                    type="text"
                    name="mainHubAddress"
                    value={formData.mainHubAddress || ''}
                    onChange={handleChange}
                    placeholder="Opp. Ration Shop, Near Jayamatha Hospital, Kaliakkavillai, Panamkalai - 629153"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Delivery Coverage &amp; Service Locations
                  </label>
                  <input
                    type="text"
                    name="deliveryCoverage"
                    value={formData.deliveryCoverage || ''}
                    onChange={handleChange}
                    placeholder="Marthandam • Nagercoil • Kanyakumari • Trivandrum (TRV) Airport • Kuzhithurai"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION: ACTING DRIVER SERVICE */}
        {activeSection === 'actingDriver' && (
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  🚗 Acting Driver &amp; Chauffeur Service Spotlight
                </h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                  Promote on-demand acting driver hiring for customers' personal vehicles or rental cars across local and outstation trips.
                </p>
              </div>

              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: formData.actingDriverEnabled !== false ? '#ecfdf5' : '#f8fafc', padding: '8px 16px', borderRadius: '10px', border: `1px solid ${formData.actingDriverEnabled !== false ? '#a7f3d0' : '#e2e8f0'}`, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="actingDriverEnabled"
                  checked={formData.actingDriverEnabled !== false}
                  onChange={handleChange}
                  style={{ width: '18px', height: '18px', accentColor: '#10b981' }}
                />
                <span style={{ fontSize: '13px', fontWeight: 700, color: formData.actingDriverEnabled !== false ? '#065f46' : '#64748b' }}>
                  {formData.actingDriverEnabled !== false ? '🟢 Section Active & Visible on Homepage' : '⚪ Section Hidden from Homepage'}
                </span>
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Badge Tagline
                </label>
                <input
                  type="text"
                  name="actingDriverBadge"
                  value={formData.actingDriverBadge || ''}
                  onChange={handleChange}
                  placeholder="e.g. Professional On-Demand Drivers"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Pricing / Rate Highlight
                </label>
                <input
                  type="text"
                  name="actingDriverRate"
                  value={formData.actingDriverRate || ''}
                  onChange={handleChange}
                  placeholder="e.g. Starting from ₹500/trip or ₹800/day"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Main Headline *
              </label>
              <input
                type="text"
                name="actingDriverTitle"
                value={formData.actingDriverTitle || ''}
                onChange={handleChange}
                placeholder="e.g. Need an Experienced Acting Driver?"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 600, boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Service Description &amp; Elevator Pitch *
              </label>
              <textarea
                rows={3}
                name="actingDriverSubtitle"
                value={formData.actingDriverSubtitle || ''}
                onChange={handleChange}
                placeholder="Describe your acting driver service, experience, reliability, and coverage areas..."
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </div>

            <h4 style={{ margin: '16px 0 10px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
              Key Value Highlights (4 Bullet Points)
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Feature 1 (Vehicles Handled)</label>
                <input
                  type="text"
                  name="actingDriverFeature1"
                  value={formData.actingDriverFeature1 || ''}
                  onChange={handleChange}
                  placeholder="Expert Drivers for Manual & Automatic Vehicles"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Feature 2 (Route Types)</label>
                <input
                  type="text"
                  name="actingDriverFeature2"
                  value={formData.actingDriverFeature2 || ''}
                  onChange={handleChange}
                  placeholder="Local Commutes & Outstation Highway Trips"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Feature 3 (Verification & Safety)</label>
                <input
                  type="text"
                  name="actingDriverFeature3"
                  value={formData.actingDriverFeature3 || ''}
                  onChange={handleChange}
                  placeholder="Strict Background Verification & Police Verified"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Feature 4 (Availability / Emergency)</label>
                <input
                  type="text"
                  name="actingDriverFeature4"
                  value={formData.actingDriverFeature4 || ''}
                  onChange={handleChange}
                  placeholder="24/7 On-Call & Emergency Night Driver Availability"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                WhatsApp Action Button Text
              </label>
              <input
                type="text"
                name="actingDriverCtaText"
                value={formData.actingDriverCtaText || ''}
                onChange={handleChange}
                placeholder="Book Acting Driver via WhatsApp"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>

            {/* LIVE PREVIEW OF ACTING DRIVER CARD */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#f96d00', marginBottom: '10px' }}>
                👁️ Live Customer Homepage Spotlight Preview
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                borderRadius: '16px',
                padding: '28px 24px',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(249, 109, 0, 0.2)', color: '#f96d00', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '12px' }}>
                  <FaUserTie /> {formData.actingDriverBadge || 'Professional On-Demand Drivers'}
                </div>
                <h4 style={{ fontSize: '20px', fontWeight: 900, margin: '0 0 8px', color: '#fff' }}>
                  {formData.actingDriverTitle || 'Need an Experienced Acting Driver?'}
                </h4>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px', lineHeight: 1.5 }}>
                  {formData.actingDriverSubtitle || 'Hire trusted, background-verified acting drivers for your personal vehicle or rental car.'}
                </p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#25D366', color: '#fff', padding: '8px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '13px' }}>
                  <FaWhatsapp size={16} /> {formData.actingDriverCtaText || 'Book Acting Driver via WhatsApp'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION: COMPANY LOCATION & INTERACTIVE MAP POINT (DEDICATED PANEL) */}
        {activeSection === 'location' && (
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  📍 Company Location &amp; Map Pin Point
                </h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                  Configure your company's physical location and map pin point. This exact spot is highlighted on the interactive map on the customer About page so customers clearly understand where the company is located.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '18px' }}>
              {/* Field 1: Physical Location Address */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                  🏢 Company Address / Physical Location
                </label>
                <input
                  type="text"
                  name="companyLocation"
                  value={formData.companyLocation || ''}
                  onChange={handleChange}
                  placeholder="e.g. Connaught Place, Inner Circle, New Delhi 110001"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
                <span style={{ display: 'block', fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                  The formal company address displayed on the customer website and booking receipts.
                </span>
              </div>

              {/* Field 2: Map Pinpoint Query */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                  🎯 Map Pinpoint Location / Landmark (Point on Map)
                </label>
                <input
                  type="text"
                  name="companyMapQuery"
                  value={formData.companyMapQuery || ''}
                  onChange={handleChange}
                  placeholder="e.g. Connaught Place, New Delhi, India or 28.6315, 77.2167"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
                <span style={{ display: 'block', fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                  Search term, landmark, or GPS coordinates to accurately pin your company point on Google Maps.
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '22px' }}>
              {/* Field 3: Location Hub Label / Tag */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                  🏷️ Hub Label / Tagline
                </label>
                <input
                  type="text"
                  name="companyLocationNotes"
                  value={formData.companyLocationNotes || ''}
                  onChange={handleChange}
                  placeholder="e.g. Main Corporate Fleet Hub &amp; Customer Handover Bay"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
                <span style={{ display: 'block', fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                  A subtitle or badge describing this hub on the About page.
                </span>
              </div>

              {/* Field 4: Custom Embed URL (Optional) */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                  🔗 Custom Google Map Embed URL (Optional)
                </label>
                <input
                  type="text"
                  name="companyMapEmbedUrl"
                  value={formData.companyMapEmbedUrl || ''}
                  onChange={handleChange}
                  placeholder="Leave empty for auto-generated Google Maps point"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
                <span style={{ display: 'block', fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                  Optional direct embed URL if you have a custom Google Maps place link.
                </span>
              </div>
            </div>

            {/* Live Interactive Map Preview in Admin */}
            <div style={{ marginTop: '16px', paddingTop: '18px', borderTop: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a', display: 'inline-block' }}></span>
                  <strong style={{ fontSize: '13px', color: '#0f172a' }}>Live Map Point Preview (Customer View)</strong>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Pointed at: <strong style={{ color: 'var(--primary, #f96d00)' }}>{formData.companyMapQuery || formData.companyLocation || 'Connaught Place, New Delhi'}</strong>
                </div>
              </div>

              <div style={{
                height: '280px',
                width: '100%',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '2px solid #cbd5e1',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                position: 'relative',
                background: '#e2e8f0'
              }}>
                <iframe
                  title="Admin Location Map Preview"
                  src={formData.companyMapEmbedUrl || `https://maps.google.com/maps?q=${encodeURIComponent(formData.companyMapQuery || formData.companyLocation || 'Connaught Place, New Delhi, India')}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                  width="100%"
                  height="100%"
                  style={{ border: 0, display: 'block', width: '100%', height: '100%' }}
                  allowFullScreen=""
                  loading="lazy"
                />
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: 'rgba(15, 23, 42, 0.88)',
                  backdropFilter: 'blur(6px)',
                  color: '#fff',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  zIndex: 2
                }}>
                  <FaMapMarkerAlt style={{ color: 'var(--primary, #f96d00)' }} />
                  <span>Company Location Point</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION: SOCIAL MEDIA HANDLES & URLS (INSTAGRAM, FB, X) */}
        {activeSection === 'social' && (
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  📱 Official Social Channels &amp; Handles
                </h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                  Manage the social media profiles linked across the customer website (Footer, Contact page, etc.).
                  Instagram is active by default. Facebook and Twitter / X are currently disabled; adding a URL here automatically enables the button on the customer website and opens the link in a new tab when clicked.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Instagram Field */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                      <FaInstagram size={16} />
                    </div>
                    Instagram Profile URL
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: formData.instagramUrl ? '#ecfdf5' : '#f1f5f9',
                      color: formData.instagramUrl ? '#047857' : '#64748b',
                      border: formData.instagramUrl ? '1px solid #a7f3d0' : '1px solid #cbd5e1'
                    }}>
                      {formData.instagramUrl ? '🟢 Active & Enabled' : '⚪ Disabled'}
                    </span>
                    {formData.instagramUrl && (
                      <a
                        href={formData.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '12px', color: '#f96d00', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        Test Link <FaExternalLinkAlt size={11} />
                      </a>
                    )}
                  </div>
                </div>
                <input
                  type="url"
                  name="instagramUrl"
                  value={formData.instagramUrl || ''}
                  onChange={handleChange}
                  placeholder="https://www.instagram.com/cabs_and_tyres?obrf=aHU4cnNnejljcGM5"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
                <span style={{ display: 'block', fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                  Default is <strong>@cabs_and_tyres</strong>. If you need to change your Instagram ID/URL, edit this field and click Save Changes below.
                </span>
              </div>

              {/* Facebook Field */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#1877f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                      <FaFacebook size={16} />
                    </div>
                    Facebook Page URL
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: formData.facebookUrl ? '#ecfdf5' : '#f8fafc',
                      color: formData.facebookUrl ? '#047857' : '#94a3b8',
                      border: formData.facebookUrl ? '1px solid #a7f3d0' : '1px solid #e2e8f0'
                    }}>
                      {formData.facebookUrl ? '🟢 Active & Enabled' : '⚪ Currently Disabled'}
                    </span>
                    {formData.facebookUrl && (
                      <a
                        href={formData.facebookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '12px', color: '#f96d00', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        Test Link <FaExternalLinkAlt size={11} />
                      </a>
                    )}
                  </div>
                </div>
                <input
                  type="url"
                  name="facebookUrl"
                  value={formData.facebookUrl || ''}
                  onChange={handleChange}
                  placeholder="https://facebook.com/your-brand (Leave empty to keep disabled)"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
                <span style={{ display: 'block', fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                  Currently disabled by default. If you add any URL here, it automatically enables the Facebook button on the customer website and opens in a new tab.
                </span>
              </div>

              {/* Twitter / X Field */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                      <FaTwitter size={16} />
                    </div>
                    Twitter / X Profile URL
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: formData.twitterUrl ? '#ecfdf5' : '#f8fafc',
                      color: formData.twitterUrl ? '#047857' : '#94a3b8',
                      border: formData.twitterUrl ? '1px solid #a7f3d0' : '1px solid #e2e8f0'
                    }}>
                      {formData.twitterUrl ? '🟢 Active & Enabled' : '⚪ Currently Disabled'}
                    </span>
                    {formData.twitterUrl && (
                      <a
                        href={formData.twitterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '12px', color: '#f96d00', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        Test Link <FaExternalLinkAlt size={11} />
                      </a>
                    )}
                  </div>
                </div>
                <input
                  type="url"
                  name="twitterUrl"
                  value={formData.twitterUrl || ''}
                  onChange={handleChange}
                  placeholder="https://twitter.com/your-brand (Leave empty to keep disabled)"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
                <span style={{ display: 'block', fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                  Currently disabled by default. If you add any URL here, it automatically enables the Twitter/X button on the customer website and opens in a new tab.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: CUSTOMER REVIEWS APPROVAL & MODERATION (NEW!) */}
        {activeSection === 'reviews' && (
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  ⭐ Customer Reviews &amp; Landing Page Slider
                </h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                  Select which real customer reviews appear on the public homepage slider. Toggle approve / hide with a single click.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setShowAddReviewModal(!showAddReviewModal)}
                  style={{
                    background: '#ea4335',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 6px rgba(234, 67, 53, 0.3)'
                  }}
                >
                  <FaGoogle /> {showAddReviewModal ? 'Close Form' : '+ Add Google Review'}
                </button>
                <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
                  🟢 {featuredOnLandingCount} Showing on Homepage
                </span>
                <span style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                  ⚪ {hiddenReviewsCount} Hidden
                </span>
              </div>
            </div>

            {/* ADD GOOGLE REVIEW / CUSTOM REVIEW FORM */}
            {showAddReviewModal && (
              <form onSubmit={handleAddReview} style={{ background: '#fff5f5', border: '2px solid #fca5a5', padding: '20px', borderRadius: '14px', marginBottom: '24px', boxShadow: '0 4px 15px rgba(234, 67, 53, 0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#ea4335', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FaGoogle size={14} />
                    </div>
                    <strong style={{ fontSize: '15px', color: '#0f172a' }}>Add Google Review (or Customer Feedback)</strong>
                  </div>
                  <button type="button" onClick={() => setShowAddReviewModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                    <FaTimes size={16} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Customer / Reviewer Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rajesh Kumar (from Google Maps)"
                      value={newReview.authorName}
                      onChange={(e) => setNewReview(p => ({ ...p, authorName: e.target.value }))}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Star Rating (1 - 5)
                    </label>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', height: '38px' }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setNewReview(p => ({ ...p, rating: s }))}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                        >
                          <FaStar size={22} color={s <= newReview.rating ? '#f59e0b' : '#cbd5e1'} />
                        </button>
                      ))}
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginLeft: '6px' }}>
                        {newReview.rating} of 5 Stars
                      </span>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Review Source
                    </label>
                    <select
                      value={newReview.source}
                      onChange={(e) => setNewReview(p => ({ ...p, source: e.target.value }))}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    >
                      <option value="google">Google Maps / Google Review</option>
                      <option value="platform">Direct / Verified Customer</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Review Headline / Title (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Excellent car condition & punctual delivery"
                    value={newReview.title}
                    onChange={(e) => setNewReview(p => ({ ...p, title: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Review Feedback / Comment *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Paste the customer's Google review feedback here..."
                    value={newReview.comment}
                    onChange={(e) => setNewReview(p => ({ ...p, comment: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#0f172a', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={newReview.showOnLanding}
                      onChange={(e) => setNewReview(p => ({ ...p, showOnLanding: e.target.checked }))}
                      style={{ width: '16px', height: '16px', accentColor: '#10b981' }}
                    />
                    Feature immediately on public homepage slider
                  </label>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setShowAddReviewModal(false)}
                      style={{ padding: '8px 14px', borderRadius: '6px', background: '#f1f5f9', border: '1px solid #cbd5e1', fontSize: '13px', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addingReview}
                      style={{ padding: '8px 20px', borderRadius: '6px', background: '#ea4335', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      {addingReview ? 'Saving...' : 'Publish Google Review'}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Configurable Section Heading on Homepage */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', marginBottom: '10px' }}>
                Homepage Section Titles
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Section Heading
                  </label>
                  <input
                    type="text"
                    name="reviewsTitle"
                    value={formData.reviewsTitle}
                    onChange={handleChange}
                    placeholder="What Our Renters Say"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Section Subheading
                  </label>
                  <input
                    type="text"
                    name="reviewsSubtitle"
                    value={formData.reviewsSubtitle}
                    onChange={handleChange}
                    placeholder="Authentic reviews and driving impressions from verified customers"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>

            {/* List of Customer Reviews */}
            {reviewsLoading ? (
              <div style={{ textAlign: 'center', padding: '30px' }}>
                <div className="spinner" style={{ width: '28px', height: '28px', margin: '0 auto' }}></div>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>Loading customer reviews...</p>
              </div>
            ) : customerReviews.length === 0 ? (
              <div style={{ background: '#f8fafc', padding: '32px', borderRadius: '12px', textAlign: 'center', border: '1px dashed #cbd5e1' }}>
                <FaCommentDots size={32} style={{ color: '#94a3b8', marginBottom: '8px' }} />
                <h4 style={{ margin: '0 0 4px', color: '#0f172a' }}>No Customer Reviews Yet</h4>
                <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                  When customers complete car rentals and leave feedback, their reviews will appear here for you to feature on the homepage.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {customerReviews.map((rev) => {
                  const reviewerName = rev.authorName || rev.user?.name || 'Customer';
                  const reviewerEmail = rev.user?.email || '';
                  const isGoogleReview = rev.source === 'google';
                  const initials = reviewerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'CU';
                  const car = rev.car || {};
                  const isFeatured = !!rev.showOnLanding;

                  return (
                    <div
                      key={rev._id}
                      style={{
                        background: isFeatured ? '#f0fdf4' : '#ffffff',
                        border: isFeatured ? '2px solid #86efac' : '1px solid #e2e8f0',
                        borderRadius: '14px',
                        padding: '18px 20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        transition: 'all 0.2s ease',
                        boxShadow: isFeatured ? '0 4px 12px rgba(16, 185, 129, 0.08)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                        {/* Reviewer & Rented Car Details */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '50%',
                              background: isGoogleReview ? '#ea4335' : '#f96d00',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '13px'
                            }}
                          >
                            {initials}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <strong style={{ fontSize: '14px', color: '#0f172a' }}>{reviewerName}</strong>
                              {reviewerEmail && (
                                <span style={{ fontSize: '11px', color: '#64748b' }}>({reviewerEmail})</span>
                              )}
                              {isGoogleReview ? (
                                <span style={{ fontSize: '11px', background: '#fef2f2', color: '#ea4335', border: '1px solid #fecaca', padding: '1px 8px', borderRadius: '4px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <FaGoogle size={10} /> Google Review
                                </span>
                              ) : (
                                <span style={{ fontSize: '10px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                  ✓ Verified Renter
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                              Submitted on {formatDate(rev.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Rented Car Badge & Stars */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {car.name && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', padding: '4px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
                              <FaCar size={12} color="#f96d00" />
                              <strong style={{ color: '#0f172a' }}>{car.brand} {car.name}</strong>
                            </div>
                          )}

                          <div style={{ display: 'flex', gap: '2px', color: '#f59e0b' }}>
                            {[1, 2, 3, 4, 5].map((s) => (
                              <FaStar key={s} size={14} color={s <= rev.rating ? '#f59e0b' : '#cbd5e1'} />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Review Comment Content */}
                      <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        {rev.title && (
                          <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                            &ldquo;{rev.title}&rdquo;
                          </h4>
                        )}
                        <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
                          {rev.comment}
                        </p>
                      </div>

                      {/* Approval Toggle Controls */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          {isFeatured ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#047857' }}>
                              <FaCheckCircle /> Approved &amp; Live on Homepage Slider
                            </span>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                              Hidden from Homepage (Internal record only)
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            type="button"
                            disabled={togglingId === rev._id}
                            onClick={() => handleToggleLanding(rev)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '7px 14px',
                              borderRadius: '8px',
                              border: isFeatured ? '1px solid #cbd5e1' : 'none',
                              background: isFeatured ? '#ffffff' : '#10b981',
                              color: isFeatured ? '#475569' : '#ffffff',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {isFeatured ? (
                              <>
                                <FaEyeSlash /> Hide from Homepage
                              </>
                            ) : (
                              <>
                                <FaEye /> Feature on Homepage Slider
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(rev._id)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '7px 10px',
                              borderRadius: '8px',
                              border: '1px solid #fee2e2',
                              background: '#fff',
                              color: '#ef4444',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                            title="Delete review permanently"
                          >
                            <FaTrash size={11} /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SECTION: FAQS ACCORDION */}
        {activeSection === 'faqs' && (
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  ❓ Frequently Asked Questions (Accordion Manager)
                </h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                  Manage the FAQ items shown on the customer homepage. Customers can click each question to expand and read transparent rental details.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenAddFaq}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#f96d00',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(249, 109, 0, 0.25)'
                }}
              >
                <FaPlus size={12} /> Add New FAQ
              </button>
            </div>

            {/* Section Headings */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '22px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Section Heading
                </label>
                <input
                  type="text"
                  name="faqsTitle"
                  value={formData.faqsTitle || ''}
                  onChange={handleChange}
                  placeholder="Frequently Asked Questions"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Section Subheading
                </label>
                <input
                  type="text"
                  name="faqsSubtitle"
                  value={formData.faqsSubtitle || ''}
                  onChange={handleChange}
                  placeholder="Everything you need to know about renting a car and booking with a professional acting driver..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* List of FAQs */}
            {(!formData.faqs || formData.faqs.length === 0) ? (
              <div style={{ background: '#f8fafc', padding: '36px', borderRadius: '12px', textAlign: 'center', border: '1px dashed #cbd5e1' }}>
                <FaQuestionCircle size={32} style={{ color: '#94a3b8', marginBottom: '10px' }} />
                <h4 style={{ margin: '0 0 6px', color: '#0f172a' }}>No FAQ Items Added</h4>
                <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '13px' }}>
                  Add common customer questions about security deposit, acting drivers, pickup points, and documents.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddFaq}
                  style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                >
                  <FaPlus size={11} style={{ marginRight: '6px' }} /> Add First Question
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(formData.faqs || []).map((faq, idx) => (
                  <div
                    key={faq.id || idx}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '16px 18px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '260px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span style={{ background: '#fff7ed', color: '#f96d00', border: '1px solid #ffedd5', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>
                            Q{idx + 1}
                          </span>
                          <strong style={{ fontSize: '14px', color: '#0f172a' }}>
                            {faq.question}
                          </strong>
                        </div>
                        <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.5, paddingLeft: '2px' }}>
                          {faq.answer}
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEditFaq(faq)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            background: '#f8fafc',
                            color: '#334155',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          <FaEdit size={12} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFaq(faq.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid #fee2e2',
                            background: '#fff',
                            color: '#ef4444',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          <FaTrash size={11} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* LIVE PREVIEW OF FAQS ACCORDION */}
            {Array.isArray(formData.faqs) && formData.faqs.length > 0 && (
              <div style={{ marginTop: '28px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#f96d00', marginBottom: '12px' }}>
                  👁️ Interactive Customer Accordion Preview
                </div>
                <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {formData.faqs.map((faq, idx) => {
                    const isOpen = expandedFaqPreview === (faq.id || idx);
                    return (
                      <div
                        key={faq.id || idx}
                        style={{
                          background: '#fff',
                          border: isOpen ? '1.5px solid #f96d00' : '1px solid #e2e8f0',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          boxShadow: isOpen ? '0 4px 12px rgba(249, 109, 0, 0.08)' : '0 1px 3px rgba(0,0,0,0.02)'
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedFaqPreview(isOpen ? null : (faq.id || idx))}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '14px 18px',
                            background: isOpen ? '#fffaf5' : '#fff',
                            border: 'none',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            fontSize: '13.5px',
                            fontWeight: 700,
                            color: isOpen ? '#f96d00' : '#0f172a',
                            gap: '12px'
                          }}
                        >
                          <span>{faq.question}</span>
                          {isOpen ? <FaChevronUp size={12} color="#f96d00" /> : <FaChevronDown size={12} color="#94a3b8" />}
                        </button>
                        {isOpen && (
                          <div style={{ padding: '14px 18px', fontSize: '13px', color: '#475569', lineHeight: 1.6, background: '#fff', borderTop: '1px solid #fed7aa' }}>
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECTION 5: STATISTICS COUNTERS */}
        {activeSection === 'stats' && (
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
              📊 Statistics Counters
            </h3>
            <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: '13px' }}>
              Display impressive customer counts, fleet size, satisfaction rate, and support availability in the social proof banner.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#f96d00', display: 'block', marginBottom: '8px' }}>COUNTER 1</span>
                <input
                  type="text"
                  name="stat1Number"
                  value={formData.stat1Number}
                  onChange={handleChange}
                  placeholder="56+"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 700, marginBottom: '8px', boxSizing: 'border-box' }}
                />
                <input
                  type="text"
                  name="stat1Label"
                  value={formData.stat1Label}
                  onChange={handleChange}
                  placeholder="Available Vehicles"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#f96d00', display: 'block', marginBottom: '8px' }}>COUNTER 2</span>
                <input
                  type="text"
                  name="stat2Number"
                  value={formData.stat2Number}
                  onChange={handleChange}
                  placeholder="2,400+"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 700, marginBottom: '8px', boxSizing: 'border-box' }}
                />
                <input
                  type="text"
                  name="stat2Label"
                  value={formData.stat2Label}
                  onChange={handleChange}
                  placeholder="Happy Customers"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#f96d00', display: 'block', marginBottom: '8px' }}>COUNTER 3</span>
                <input
                  type="text"
                  name="stat3Number"
                  value={formData.stat3Number}
                  onChange={handleChange}
                  placeholder="100%"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 700, marginBottom: '8px', boxSizing: 'border-box' }}
                />
                <input
                  type="text"
                  name="stat3Label"
                  value={formData.stat3Label}
                  onChange={handleChange}
                  placeholder="Satisfaction Rate"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#f96d00', display: 'block', marginBottom: '8px' }}>COUNTER 4</span>
                <input
                  type="text"
                  name="stat4Number"
                  value={formData.stat4Number}
                  onChange={handleChange}
                  placeholder="24/7"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 700, marginBottom: '8px', boxSizing: 'border-box' }}
                />
                <input
                  type="text"
                  name="stat4Label"
                  value={formData.stat4Label}
                  onChange={handleChange}
                  placeholder="Customer Support"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 6: SERVICES & CALL TO ACTION */}
        {activeSection === 'cta' && (
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
              🚗 Services &amp; Bottom Call-to-Action
            </h3>
            <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: '13px' }}>
              Configure services section headings and the bottom high-converting CTA block.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '22px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Services Section Heading
                </label>
                <input
                  type="text"
                  name="servicesTitle"
                  value={formData.servicesTitle}
                  onChange={handleChange}
                  placeholder="What We Offer"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Services Subheading
                </label>
                <input
                  type="text"
                  name="servicesSubtitle"
                  value={formData.servicesSubtitle}
                  onChange={handleChange}
                  placeholder="Tailored automotive services to cater to every occasion"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '18px' }}>
              <h4 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                Bottom CTA Banner
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      CTA Pill Badge
                    </label>
                    <input
                      type="text"
                      name="ctaBadge"
                      value={formData.ctaBadge || ''}
                      onChange={handleChange}
                      placeholder="e.g. READY TO HIT THE ROAD?"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      CTA Button Text
                    </label>
                    <input
                      type="text"
                      name="ctaButtonText"
                      value={formData.ctaButtonText || ''}
                      onChange={handleChange}
                      placeholder="e.g. Sign Up Now to Book"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    CTA Banner Title
                  </label>
                  <input
                    type="text"
                    name="ctaTitle"
                    value={formData.ctaTitle}
                    onChange={handleChange}
                    placeholder="Ready to Hit the Road?"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    CTA Description
                  </label>
                  <textarea
                    rows={2}
                    name="ctaDesc"
                    value={formData.ctaDesc}
                    onChange={handleChange}
                    placeholder="Create your account now and start exploring our premium fleet..."
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            type="submit"
            disabled={saving}
            className="btn-admin-primary"
            style={{ padding: '12px 30px', fontSize: '14px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <FaSave /> {saving ? 'Publishing Live Changes...' : 'Save & Publish Live'}
          </button>
        </div>
      </form>

      {/* FAQ ADD / EDIT MODAL */}
      {showFaqModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            maxWidth: '560px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f96d00', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FaQuestionCircle size={16} />
                </div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                  {editingFaqId ? 'Edit FAQ Item' : 'Add New FAQ Question'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => { setShowFaqModal(false); setEditingFaqId(null); }}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <FaTimes size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveFaq} style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                  Question *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Can I hire an acting driver for my outstation trip?"
                  value={faqForm.question}
                  onChange={(e) => setFaqForm(p => ({ ...p, question: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                  Answer *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide a clear, helpful answer explaining policies, requirements, or rates..."
                  value={faqForm.answer}
                  onChange={(e) => setFaqForm(p => ({ ...p, answer: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => { setShowFaqModal(false); setEditingFaqId(null); }}
                  style={{ padding: '9px 16px', borderRadius: '8px', background: '#f1f5f9', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 22px', borderRadius: '8px', background: '#f96d00', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <FaCheck size={12} /> {editingFaqId ? 'Update FAQ' : 'Add FAQ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
