'use client';

import { I18nextProvider } from 'react-i18next';
import initTranslations from '../lib/i18n.client';
import { useState, useEffect } from 'react';

let i18n;

export default function TranslationsProvider({
  children,
  locale,
  namespaces,
  resources
}) {
  const [i18nInstance, setI18nInstance] = useState(i18n);

  useEffect(() => {
    const init = async () => {
      if (!i18n) {
        i18n = await initTranslations(locale, namespaces);
      }

      if (resources) {
          Object.keys(resources).forEach((lang) => {
              Object.keys(resources[lang]).forEach((ns) => {
                  i18n.addResourceBundle(lang, ns, resources[lang][ns]);
              });
          });
      }
      setI18nInstance(i18n);
    };

    init();
  }, [locale, namespaces, resources]);

  if (!i18nInstance) return null;

  return <I18nextProvider i18n={i18nInstance}>{children}</I18nextProvider>;
}