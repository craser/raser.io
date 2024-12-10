import Link from "next/link";
import styles from './FrontPageLayout.module.scss'
import HeaderNavigationOptions from "@/components/templates/HeaderNavigationOptions";
import Search from "@/components/search/Search";

export default function FrontPageLayout({ content }) {
    return (
        <div className={styles.frontpage}>
            <header className={styles.header}>
                <h1 className={styles.titleBanner}>
                    <Link href={'/'}>raser . io</Link>
                </h1>
                <HeaderNavigationOptions/>
            </header>
            <main className={styles.content}>
                <Search/>
                {content}
            </main>
        </div>
    )
}
