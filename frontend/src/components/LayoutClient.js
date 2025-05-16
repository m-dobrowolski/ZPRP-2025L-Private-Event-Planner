'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {useTranslation} from "react-i18next";

function LayoutClient() {
    const router = useRouter();
    const params = useParams()
    const [isMounted, setIsMounted] = useState(false);
    const currentLocale = params.locale;

    useEffect(() => {
    setIsMounted(true);
    }, []);

    const { t } = useTranslation('translation');

    if (!isMounted) {
      return null;
    }

    return (
    <>
        <Link href={`/${currentLocale}`} className="logo-link">
            <img src="/logo.png" alt="Logo" className="logo"/>
        </Link>

        <button className="create-event-button" onClick={() => {
            router.push(`/${currentLocale}/create-event`);
        }}>
            {t('create_button_text')}
        </button>

    </>
    );
}

export default LayoutClient;