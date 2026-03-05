import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager, Platform } from 'react-native';
// expo-updates is only available in production builds
let Updates: { reloadAsync: () => Promise<void> } | null = null;
try { Updates = require('expo-updates'); } catch {}

import ar from './ar.json';
import en from './en.json';

const resources = {
  ar: { translation: ar },
  en: { translation: en },
};

// Always default to Arabic — this is a Saudi-market app
const selectedLanguage = 'ar';

// Force RTL layout for Arabic
if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
  // Android requires a restart for RTL to take effect
  if (Platform.OS === 'android') {
    if (!__DEV__ && Updates) {
      Updates.reloadAsync().catch(() => {});
    }
  }
}

i18n.use(initReactI18next).init({
  resources,
  lng: selectedLanguage,
  fallbackLng: 'ar',
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v4',
});

export default i18n;
