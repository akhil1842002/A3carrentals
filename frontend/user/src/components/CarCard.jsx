import { Link } from 'react-router-dom';
import { FiUsers, FiSliders, FiDroplet, FiCheckCircle, FiClock, FiTool } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { getWhatsAppLink } from '../api';
import { useSettings } from '../context/SettingsContext';

export default function CarCard({ car }) {
  const { settings } = useSettings();
  const image = car.images && car.images.length > 0 
    ? car.images[0] 
    : '/images/car-1.jpg';

  const isRented = car.status === 'rented';
  const isMaintenance = car.status === 'maintenance';
  const isAvailable = !isRented && !isMaintenance;

  const waMessage = isRented
    ? `Hi, I saw the ${car.name} (${car.brand} ${car.model}) is currently rented. When will it become available next?`
    : `Hi, I am interested in renting the ${car.name} (${car.brand} ${car.model}) for ${settings.currencySymbol || '₹'}${car.pricePerDay}/day. Please confirm availability.`;

  return (
    <div className={`car-card ${isRented ? 'is-rented' : ''}`}>
      <div 
        className="car-card-img" 
        style={{ backgroundImage: `url(${image})` }}
      >
        <div className="card-badge-row">
          <span className="car-badge">{car.vehicleType || 'Sedan'}</span>
          
          {isAvailable && (
            <span className="car-status-pill available">
              <FiCheckCircle /> Available
            </span>
          )}
          {isRented && (
            <span className="car-status-pill rented">
              <FiClock /> Rented
            </span>
          )}
          {isMaintenance && (
            <span className="car-status-pill maintenance">
              <FiTool /> In Service
            </span>
          )}
        </div>
      </div>

      <div className="car-card-body">
        <h3>{car.name}</h3>
        <div className="car-card-meta">
          <span className="brand">{car.brand} • {car.year || 2024}</span>
          <span className="price">{settings.currencySymbol || '₹'}{car.pricePerDay} <span>/ day</span></span>
        </div>

        <div className="car-card-specs">
          <div className="spec" title="Seats">
            <FiUsers />
            <span>{car.seats || 4} Seats</span>
          </div>
          <div className="spec" title="Transmission">
            <FiSliders />
            <span>{car.transmission || 'Auto'}</span>
          </div>
          <div className="spec" title="Fuel Type">
            <FiDroplet />
            <span>{car.fuelType || 'Petrol'}</span>
          </div>
        </div>

        <div className="car-card-actions">
          <Link to={`/cars/${car._id}`} className="btn btn-outline">
            Details
          </Link>
          
          <a
            href={getWhatsAppLink(waMessage, settings.whatsappNumber)}
            target="_blank"
            rel="noopener noreferrer"
            className={`btn ${isRented ? 'btn-rented' : 'btn-whatsapp'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <FaWhatsapp /> {isRented ? 'Inquire Date' : 'Book Now'}
          </a>
        </div>
      </div>
    </div>
  );
}
