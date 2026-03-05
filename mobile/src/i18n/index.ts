import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import { I18nManager } from 'react-native';

import ar from './ar.json';
import en from './en.json';

const resources = {
  ar: { translation: ar },
  en: { translation: en },
};

const deviceLocales = getLocales();
const deviceLanguage = deviceLocales?.[0]?.languageCode ?? 'ar';

// Use device language if we support it, otherwise fall back to Arabic
const selectedLanguage = deviceLanguage in resources ? deviceLanguage : 'ar';

// Force RTL layout for Arabic
const isRTL = selectedLanguage === 'ar';
I18nManager.forceRTL(isRTL);
I18nManager.allowRTL(isRTL);

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
