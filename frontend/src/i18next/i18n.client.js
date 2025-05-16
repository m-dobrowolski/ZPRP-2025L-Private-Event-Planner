// lib/i18n.client.js (or wherever you keep client utilities)
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import i18nConfig from '&/next-i18next.config';

export default async function initTranslations(locale, namespaces) {
  const i18nInstance = createInstance();

  await i18nInstance
    .use(initReactI18next) // Tell i18next to use react-i18next
    .init({
      lng: locale,
      resources: {}, // Resources will be provided by the provider
      fallbackLng: i18nConfig.i18n.defaultLocale,
      supportedLngs: i18nConfig.i18n.locales,
      defaultNS: namespaces[0],
      ns: namespaces,
      react: { useSuspense: false },
    });

  return i18nInstance;
}