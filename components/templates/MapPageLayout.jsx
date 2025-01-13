import Link from "next/link";
import styles from './MapPageLayout.module.scss'
import SiteNavigationHeader from "@/components/templates/SiteNavigationHeader";

export default function MapPageLayout(props) {
    return (
        <div className={styles.mappage}>
            <header className={styles.header}>
                <h1 className={styles.titleBanner}>
                    <Link href={'/'}>raser . io</Link>
                </h1>
            </header>
            <main className={styles.content}>
                {props.children}
            </main>
        </div>
    )
}
