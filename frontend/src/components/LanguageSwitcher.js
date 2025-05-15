'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';

function LanguageSwitcher() {
    const router = useRouter();
    const { locales, locale: currentLocale } = router;
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const otherLocales = locales ? locales.filter((locale) => locale !== currentLocale) : [];

    if (!isMounted) {
        return null;
    }

    return (
        <div>
            {otherLocales.map((locale) => (
                <Link key={locale} href={router.asPath} locale={locale}>
                    {locale === 'en' ? 'English' : 'Polski'}
                </Link>
            ))}
        </div>
    );
}

export default LanguageSwitcher;