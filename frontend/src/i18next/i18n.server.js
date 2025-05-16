import { createInstance } from 'i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import { initReactI18next } from 'react-i18next/initReactI18next';
import i18nConfig from '&/next-i18next.config';

const initTranslations = async (locale, namespaces, i18nInstance) => {
  i18nInstance = i18nInstance || createInstance();

  await i18nInstance
    .use(initReactI18next)
    .use(resourcesToBackend(
      (language, namespace) => import(`&/public/locales/${language}/${namespace}.json`)
    )) // Load translations
    .init({
      lng: locale,
      fallbackLng: i18nConfig.i18n.defaultLocale,
      supportedLngs: i18nConfig.i18n.locales,
      defaultNS: namespaces[0], // Use the first namespace as default
      ns: namespaces,
      preload: typeof window === 'undefined' ? i18nConfig.i18n.locales : [], // Preload on server
      react: { useSuspense: false }, // Disable suspense
    });

  return {
    i18n: i18nInstance,
    resources: i18nInstance.services.resourceStore.data,
    t: i18nInstance.t,
  };
};

export { initTranslations };