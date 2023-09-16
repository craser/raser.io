import Link from "next/link";
import styles from './MapPageLayout.module.scss'
import HeaderNavigationOptions from "@/components/templates/HeaderNavigationOptions";
import EntryCacheContext from "@/components/context/EntryCacheContext";

export default function MapPageLayout(props) {
    return (
        <div className={styles.mappage}>
            <header className={styles.header}>
                <h1 className={styles.titleBanner}>
                    <Link href={'/'}>dreadedmonkeygod . net</Link>
                </h1>
                <HeaderNavigationOptions/>
            </header>
            <main className={styles.content}>
                {props.content}
            </main>
        </div>
    )
}
