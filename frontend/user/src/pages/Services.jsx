import { Link } from 'react-router-dom';
import { FaCar, FaUserTie, FaShieldAlt, FaHeadset, FaWhatsapp, FaPlane, FaHeart, FaMapMarkerAlt } from 'react-icons/fa';
import { getWhatsAppLink } from '../api';
import { useSettings } from '../context/SettingsContext';
import useSeo from '../hooks/useSeo';

export default function Services() {
  useSeo({
    title: 'Car Rental Services in Kaliakkavilai — Self-Drive, Driver, Airport Transfers',
    description: 'A3 Car Rentals offers Wedding car hire, Airport transfer to Trivandrum (TRV), Kanyakumari Tours, Acting Driver service, Self-Drive rentals and Corporate packages across Kaliakkavilai, Marthandam & Nagercoil.',
    canonical: 'https://a3carrentals.in/services',
    keywords: ['wedding car rental Kaliakkavilai', 'airport transfer Trivandrum from Kaliakkavilai', 'Kanyakumari tour car rental', 'acting driver Marthandam', 'self drive car service Nagercoil']
  });
  const { settings } = useSettings();
  const services = [
    {
      icon: <FaHeart />,
      title: 'Wedding Ceremony Rentals',
      desc: 'Make your special day memorable with luxury wedding cars across Kaliakkavilai, Marthandam, Kuzhithurai & Kanyakumari. Professional drivers included.'
    },
    {
      icon: <FaCar />,
      title: 'City & Inter-State Transfer',
      desc: 'Punctual point-to-point transfers and self-drive cars across Kaliakkavilai, Parasala, Marthandam, Nagercoil & Trivandrum.'
    },
    {
      icon: <FaPlane />,
      title: 'Airport Transfer (TRV)',
      desc: 'Prompt pickup and drop-off to Trivandrum International Airport (TRV) from Kaliakkavilai with real-time flight tracking.'
    },
    {
      icon: <FaMapMarkerAlt />,
      title: 'Kanyakumari & Kerala Tours',
      desc: 'Explore Kanyakumari, Trivandrum, Kovalam & Ponmudi with our scenic tour rental packages in premium vehicles.'
    },
    {
      icon: <FaUserTie />,
      title: 'Car Rentals With Acting Driver',
      desc: 'Rent any car from our Kaliakkavilai hub with experienced, police-verified acting drivers for local and outstation journeys.'
    },
    {
      icon: <FaShieldAlt />,
      title: 'Full Insurance',
      desc: 'Comprehensive insurance coverage on all rental vehicles for complete peace of mind.'
    },
    {
      icon: <FaHeadset />,
      title: '24/7 Support',
      desc: 'Round-the-clock customer support via WhatsApp, phone, and email for all your queries.'
    },
    {
      icon: <FaCar />,
      title: 'Corporate Rentals',
      desc: 'Special packages for businesses - fleet management, long-term leasing, and dedicated driver services.'
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
            <p>We provide a comprehensive range of automotive services tailored to your needs</p>
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
          <h2>Need a Custom Service? Contact Us!</h2>
          <p style={{ maxWidth: '600px', margin: '15px auto 30px' }}>
            We'll tailor a package specifically for your requirements. Get in touch now!
          </p>
          <a
            href={getWhatsAppLink('Hi CarBook! I need information about your custom services. Can you help?', settings.whatsappNumber)}
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
