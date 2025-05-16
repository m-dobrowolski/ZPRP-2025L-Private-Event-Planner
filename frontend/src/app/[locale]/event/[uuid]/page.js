import { initTranslations } from '@/i18next/i18n.server';
import TranslationsProvider from '@/components/TranslationsProvider'; 
import i18nConfig from '&/next-i18next.config'; 
import EventDetailsClient from '@/components/EventDetailsClient';

export async function generateStaticParams() {
    return i18nConfig.i18n.locales.map((locale) => ({ locale }));
}

const i18nNamespaces = ['translation'];

export default async function EventDetailPage({ params: { locale, uuid } }) {
    const { resources } = await initTranslations(locale, i18nNamespaces);
    return (
        <TranslationsProvider locale={locale} namespaces={i18nNamespaces} resources={resources}>
            <EventDetailsClient uuid={uuid} />
        </TranslationsProvider>
    );
}

export async function generateMetadata({ params: { locale, uuid } }) {
    const { t } = await initTranslations(locale, i18nNamespaces);
    const genericTitle = t('event_details_page_title');
    return { title: genericTitle };
}
