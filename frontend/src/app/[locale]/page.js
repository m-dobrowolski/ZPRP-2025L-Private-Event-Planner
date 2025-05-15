import styles from "./page.module.css"
import HomePageClient from "@/components/HomePageClient";


export default function Home() {
    return (
    <div className={styles.mainContainer}>
        <HomePageClient/>
    </div>
    );
}
