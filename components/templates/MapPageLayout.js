import Link from "next/link";
import styles from './MapPageLayout.module.scss'
import HeaderNavigationOptions from "@/components/templates/HeaderNavigationOptions";

export default function MapPageLayout(props) {
    return (
        <div className={styles.mappage}>
            <header className={styles.header}>
                <h1 className={styles.titleBanner}>
                    <Link href={'/'}>dreadedmonkeygod . net</Link>
                </h1>
            </header>
            <main className={styles.content}>
                {props.children}
            </main>
        </div>
    )
}
