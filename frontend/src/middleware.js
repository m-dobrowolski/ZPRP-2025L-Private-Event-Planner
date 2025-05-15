import { NextResponse } from 'next/server'
import { i18n } from '@/lib/i18n.config'

import Negotiator from 'negotiator'
import { match } from '@formatjs/intl-localematcher'

const locales = i18n.locales
const defaultLocale = i18n.defaultLocale

function getLocale(request) {
    // Try to get language from header, else default
    const acceptedLanguage = request.headers.get('Accept-Language') ?? undefined
    const headers = { 'accept-language': acceptedLanguage }

    const languages = new Negotiator({ headers }).languages()
    return match(languages, locales, defaultLocale)
}


export function middleware(request) {
    const { pathname } = request.nextUrl

    if (
        pathname.includes('.') &&
        !pathname.startsWith('/_next/static') &&
        !pathname.startsWith('/_next/image')
    ) {
        console.log(`[Middleware] Skipping static asset: ${pathname}`);
        return undefined;
    }

    if (
        pathname.startsWith('/api') ||
        pathname.startsWith('/_next')
    ) {
        return undefined;
    }

    const pathnameHasLocale = locales.some(
        (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    )

    if (!pathnameHasLocale) {
        const locale = getLocale(request)

        if (pathname === '/') {
            request.nextUrl.pathname = `/${locale}/`;
            return NextResponse.redirect(request.nextUrl, { status: 307 });
        }

        request.nextUrl.pathname = `/${locale}${pathname}`;
        return NextResponse.redirect(request.nextUrl);
    }

    return undefined;
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}