import styles from "./page.module.css"
import HomePageClient from "@/components/HomePageClient";
import {initTranslations} from "@/i18next/i18n.server";

const i18nNamespaces = ['translation'];

export default function Home() {
    return (
    <div className={styles.mainContainer}>
        <HomePageClient/>
    </div>
    );
}

export async function generateMetadata({ params: { locale } }) {
    const { t } = await initTranslations(locale, i18nNamespaces);
    const genericTitle = t('home_page_title');
    return { title: genericTitle };
}
