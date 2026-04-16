import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation glossaries
const resources = {
  en: {
    translation: {
      "Welcome": "Welcome",
      "Dashboard": "Dashboard",
      "Medical Records": "Medical Records",
      "Reports": "Reports",
      "My Profile": "My Profile",
      "Secure session": "Secure session",
      "Logout": "Logout",
      "Patient Directory": "Patient Directory",
      "Doctor Portal": "Doctor Portal",
      "Universal Search...": "Universal Search..."
    }
  },
  es: {
    translation: {
      "Welcome": "Bienvenido",
      "Dashboard": "Panel",
      "Medical Records": "Expedientes Médicos",
      "Reports": "Informes",
      "My Profile": "Mi Perfil",
      "Secure session": "Sesión segura",
      "Logout": "Cerrar sesión",
      "Patient Directory": "Directorio de Pacientes",
      "Doctor Portal": "Portal Médico",
      "Universal Search...": "Búsqueda universal..."
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes by default
    }
  });

export default i18n;
