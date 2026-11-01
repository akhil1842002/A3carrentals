import { Link } from 'react-router-dom';
import { FaCar, FaUserTie, FaShieldAlt, FaHeadset, FaWhatsapp, FaPlane, FaHeart, FaMapMarkerAlt } from 'react-icons/fa';
import { getWhatsAppLink } from '../api';
import { useSettings } from '../context/SettingsContext';
import useSeo from '../hooks/useSeo';

export default function Services() {
  useSeo({
    title: 'Best Car Rental Services in Kaliakkavilai & Anywhere in India',
    description: 'A3 Car rental offers Self-Drive cars, Acting Driver hire, 7-9 seater SUVs, Wedding luxury cars, Trivandrum (TRV) Airport transfers, and Doorstep Delivery across Kaliakkavilai, Marthandam & Anywhere in India. 24/7 service.',
    canonical: 'https://a3carrentals.in/services',
    keywords: [
      'best car rental service in Kaliakkavilai',
      'car rental anywhere in India',
      'acting driver service Kaliakkavilai',
      'wedding car rental Kaliakkavilai',
      'airport transfer Trivandrum from Kaliakkavilai',
      'Kanyakumari tour car rental',
      'self drive car service Marthandam',
      'Innova Crysta rental Kaliakkavilai'
    ]
  });
  const { settings } = useSettings();
  const services = [
    {
      icon: <FaHeart />,
      title: 'Wedding Ceremony Rentals',
      desc: 'Make your special day memorable with luxury wedding cars across Kaliakkavilai, Marthandam, Kuzhithurai & Kanyakumari. Uniformed professional drivers included.'
    },
    {
      icon: <FaCar />,
      title: 'City, Highway & Pan-India Handover',
      desc: 'Punctual point-to-point transfers and verified self-drive cars across Kaliakkavilai, Parasala, Marthandam, Nagercoil, Trivandrum, and doorstep delivery anywhere in India.'
    },
    {
      icon: <FaPlane />,
      title: 'Airport Transfer (TRV)',
      desc: 'Prompt pickup and drop-off to Trivandrum International Airport (TRV) from Kaliakkavilai with real-time flight tracking and luggage assistance.'
    },
    {
      icon: <FaMapMarkerAlt />,
      title: 'Kanyakumari & Kerala Tours',
      desc: 'Explore Kanyakumari, Trivandrum, Kovalam & Ponmudi with our scenic tour rental packages in premium 5-seater and 7-9 seater vehicles.'
    },
    {
      icon: <FaUserTie />,
      title: 'Car Rentals With Acting Driver',
      desc: 'Rent any car from our Kaliakkavilai hub with experienced, police-verified acting drivers for stress-free local, night, and outstation highway journeys.'
    },
    {
      icon: <FaShieldAlt />,
      title: 'Full Insurance & Zero Hidden Fees',
      desc: 'Comprehensive insurance coverage and transparent pricing on all rental vehicles for complete peace of mind.'
    },
    {
      icon: <FaHeadset />,
      title: '24/7 Round-the-Clock Support',
      desc: 'Open 24 hours every day. Emergency roadside assistance, tyre support, and phone concierge available across Tamil Nadu, Kerala & India.'
    },
    {
      icon: <FaCar />,
      title: 'Corporate & Long-Term Fleet',
      desc: 'Special customized packages for businesses — executive car hire, monthly leasing, and dedicated driver services.'
    }
  ];

  return (
    <div>
      <section className="page-header" style={{ backgroundImage: `url('/images/bg_2.jpg')` }}>
        <div className="hero-overlay"></div>
        <div className="container">
          <div className="page-header-content">
            <div className="breadcrumb">
              <Link to="/">Home</Link> <span>/</span> <span>Services</span>
            </div>
            <h1>Our Services</h1>
          </div>
        </div>
      </section>

      <section className="section" style={{ padding: '80px 0' }}>
        <div className="container">
          <div className="section-header">
            <span className="subheading">What We Offer</span>
            <h2>Our Latest Services</h2>
            <p>We provide a comprehensive range of automotive and chauffeur services tailored to your needs</p>
          </div>

          <div className="services-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {services.map((service, i) => (
              <div key={i} className="service-card">
                <div className="service-icon">{service.icon}</div>
                <h3>{service.title}</h3>
                <p>{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section" style={{ backgroundImage: `url('/images/bg_3.jpg')` }}>
        <div className="hero-overlay"></div>
        <div className="container" style={{ position: 'relative', zIndex: 2, textAlign: 'center', color: '#fff' }}>
          <h2>Need a Custom Rental Package? Contact Us!</h2>
          <p style={{ maxWidth: '600px', margin: '15px auto 30px' }}>
            We'll tailor a self-drive or acting driver package specifically for your journey across Kaliakkavilai, Kanyakumari, or anywhere in India.
          </p>
          <a
            href={getWhatsAppLink('Hi A3 Car rental! I need information about your custom car rental and acting driver services. Can you help?', settings.whatsappNumber)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-whatsapp"
            style={{ fontSize: '16px', padding: '14px 32px' }}
          >
            <FaWhatsapp size={20} /> Chat on WhatsApp
          </a>
        </div>
      </section>
    </div>
  );
}
