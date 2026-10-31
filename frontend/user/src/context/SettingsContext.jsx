import { createContext, useContext, useState, useEffect } from 'react';
import { getSettings } from '../api';

const defaultSettings = {
  businessName: 'A3 Car rental',
  currencySymbol: '₹',
  driverDailyFee: 999,
  taxRatePercent: 18,
  whatsappNumber: '919629182095',
  supportPhone: '+91 96291 82095',
  supportEmail: 'Shajanshaji111@gmail.com',
  hubAddress: 'Near by Jayamatha Hospital, Opp. Ration Shop, Kaliakkavillai, Panamkalai - 629153',
  googleMapsEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15791.058512382906!2d77.15638885576467!3d8.326171267354821!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b05ab2e7848b5e1%3A0xbe02000328d9065!2sA3%20Car%20rental!5e0!3m2!1sen!2sin!4v1793281171962!5m2!1sen!2sin',
  instagramUrl: 'https://www.instagram.com/cabs_and_tyres?obrf=aHU4cnNnejljcGM5',
  facebookUrl: '',
  twitterUrl: '',
  socialLinks: {
    instagram: 'https://www.instagram.com/cabs_and_tyres?obrf=aHU4cnNnejljcGM5',
    facebook: '',
    twitter: ''
  }
};

const SettingsContext = createContext({
  settings: defaultSettings,
  loading: true,
  refreshSettings: () => {}
});

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await getSettings();
      if (res.data) {
        setSettings(prev => ({ ...prev, ...res.data }));
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();

    const handleFocus = () => fetchSettings();
    window.addEventListener('focus', handleFocus);
    window.addEventListener('settingsUpdated', fetchSettings);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('settingsUpdated', fetchSettings);
    };
  }, []);

  useEffect(() => {
    if (settings?.businessName) {
      document.title = settings.businessName;
    }
  }, [settings?.businessName]);

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
