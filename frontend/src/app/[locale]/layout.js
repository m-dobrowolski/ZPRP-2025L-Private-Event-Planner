import { Geist, Geist_Mono } from "next/font/google";

import { initTranslations } from '@/lib/i18n.server';
import TranslationsProvider from '@/components/TranslationsProvider';
import i18nConfig from '&/next-i18next.config';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import LayoutClient from '@/components/LayoutClient';

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export async function generateStaticParams() {
  return i18nConfig.i18n.locales.map((locale) => ({ locale }));
}

const i18nNamespaces = ['translation'];

export default async function RootLayout({ children, params: { locale } }) {
    const { t, resources } = await initTranslations(locale, i18nNamespaces);

    return (
        <html lang={locale}>
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <TranslationsProvider locale={locale} namespaces={i18nNamespaces} resources={resources}>
                    <div className="layout-container">
                        <header>
                            <LanguageSwitcher/>
                        </header>

                         <aside className="sidebar">
                            <LayoutClient />
                        </aside>

                        <main className="main-content">
                            {children}
                        </main>

                        <aside className="sidebar"></aside>
                    </div>
                </TranslationsProvider>
            </body>
        </html>
    );
}