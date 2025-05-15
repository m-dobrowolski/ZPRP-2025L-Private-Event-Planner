import { initTranslations } from '@/lib/i18n.server';
import TranslationsProvider from '@/components/TranslationsProvider'; 
import i18nConfig from '&/next-i18next.config'; 
import AcceptGenericInvitationClient from '@/components/AcceptGenericInvitationClient'; 

export async function generateStaticParams() {
    return i18nConfig.i18n.locales.map((locale) => ({ locale }));
}

const i18nNamespaces = ['translation'];

export default async function AcceptGenericInvitationPage({ params: { locale, uuid } }) {
    const { resources } = await initTranslations(locale, i18nNamespaces);

    return (
        <TranslationsProvider locale={locale} namespaces={i18nNamespaces} resources={resources}>
            <AcceptGenericInvitationClient invitationUuid={uuid} />
        </TranslationsProvider>
    );
}

export async function generateMetadata({ params: { locale } }) {
    const { t } = await initTranslations(locale, i18nNamespaces);
    return { title: t('accept_generic_invitation_page_title') };
}
