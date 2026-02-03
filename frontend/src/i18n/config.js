import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// These paths point to the locales folder you already created
import en from '../locales/en/translation.json';
import hi from '../locales/hi/translation.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            hi: { translation: hi }
        },
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false
        },
        detection: {
            order: ['localStorage', 'htmlTag', 'path', 'subdomain'],
            caches: ['localStorage']
        }
    });

i18n.on('languageChanged', (lng) => {
    document.documentElement.lang = lng;
});

export default i18n;