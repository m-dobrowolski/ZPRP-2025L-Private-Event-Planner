'use client';

import {useTranslation} from "react-i18next";
import styles from "@/app/[locale]/page.module.css";

function LayoutClient() {
    const { t } = useTranslation('translation');

    return (
    <>
        <h1 className={styles.h1}>Private Event Planner</h1>
        <span className={styles.description}>
            {t('app_description')}
        </span>
    </>
    );
}

export default LayoutClient;