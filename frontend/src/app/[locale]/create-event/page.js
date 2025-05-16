import { initTranslations } from '@/i18next/i18n.server';
import TranslationsProvider from '@/components/TranslationsProvider'; 
import i18nConfig from '&/next-i18next.config.js';
import CreateEventForm from '@/components/CreateEventForm'; 

export async function generateStaticParams() {
    return i18nConfig.i18n.locales.map((locale) => ({ locale }));
}

const i18nNamespaces = ['translation'];

export default async function CreateEventPage({ params: { locale } }) {
    const { resources } = await initTranslations(locale, i18nNamespaces);
    return (
        <TranslationsProvider locale={locale} namespaces={i18nNamespaces} resources={resources}>
          <CreateEventForm />
        </TranslationsProvider>
    );
}

export async function generateMetadata({ params: { locale } }) {
    const { t } = await initTranslations(locale, i18nNamespaces);
    return {
        title: t('create_page_title'),
    };
}