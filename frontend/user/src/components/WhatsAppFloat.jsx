import { FaWhatsapp } from 'react-icons/fa';
import { getWhatsAppLink } from '../api';
import { useSettings } from '../context/SettingsContext';

export default function WhatsAppFloat() {
  const { settings } = useSettings();
  return (
    <a
      href={getWhatsAppLink('Hi! I\'m interested in your car rental services.', settings.whatsappNumber)}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-float"
      title="Chat on WhatsApp"
    >
      <FaWhatsapp />
    </a>
  );
}
