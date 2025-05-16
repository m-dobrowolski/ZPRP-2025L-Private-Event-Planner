'use client';

import { useParams, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { i18n } from '&/next-i18next.config';

function LanguageSwitcher() {
    const params = useParams();
    const pathname = usePathname();

    const [isMounted, setIsMounted] = useState(false);

    const currentLocale = params.locale;
    const supportedLocales = i18n.locales;
    const otherLocales = supportedLocales.filter((locale) => locale !== currentLocale);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return null;
    }

    const redirectedPathname = (locale) => {
        if (!pathname) {
            console.warn('Pathname is not available for redirection.');
            return '/';
        }
        const segments = pathname.split('/').filter(segment => segment !== '');
        segments[0] = locale;

        const newPath = '/' + segments.join('/');
        console.log(`Redirecting from ${pathname} to ${newPath} for locale ${locale}`);
        return newPath;
    };

    return (
        <div className="language-switcher">
            {otherLocales.map((locale) => (
                <a key={locale} href={redirectedPathname(locale)} locale={locale} className="locale-link">
                    {locale === 'en' ? (
                        <img src="/uk.svg" alt="Switch to English" width={48} height={24} title="English" />
                    ) : (
                        <img src="/pl.svg" alt="Switch to Polish" width={48} height={30} title="Polski" />
                    )}
                </a>
            ))}
        </div>
    );
}

export default LanguageSwitcher;