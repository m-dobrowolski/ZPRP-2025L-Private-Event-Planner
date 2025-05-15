import { initTranslations } from '@/lib/i18n.server';
import TranslationsProvider from '@/components/TranslationsProvider';
import i18nConfig from '&/next-i18next.config';
import EditEventClient from '@/components/EditEventClient';

export async function generateStaticParams() {
  return i18nConfig.i18n.locales.map((locale) => ({ locale }));
}

const i18nNamespaces = ['translation'];

export default async function EditEventPage({ params: { locale, uuid, edit_uuid } }) {
    const { resources } = await initTranslations(locale, i18nNamespaces);
    return (
        <TranslationsProvider locale={locale} namespaces={i18nNamespaces} resources={resources}>
            <EditEventClient uuid={uuid} edit_uuid={edit_uuid} />
        </TranslationsProvider>
    );
}

export async function generateMetadata({ params: { locale } }) {
   const { t } = await initTranslations(locale, i18nNamespaces);
   const genericTitle = t('edit_event_page_title');
   return { title: genericTitle };
}
