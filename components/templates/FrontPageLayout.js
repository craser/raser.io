import Link from "next/link";
import styles from './FrontPageLayout.module.scss'
import HeaderNavigationOptions from "@/components/templates/HeaderNavigationOptions";

export default function FrontPageLayout({ content }) {
    return (
        <div className={styles.frontpage}>
            <header className={styles.header}>
                <h1 className={styles.titleBanner}>
                    <Link href={'/'}>dreadedmonkeygod . net</Link>
                </h1>
                <HeaderNavigationOptions/>
            </header>
            <main className={styles.content}>
                {content}
            </main>
        </div>
    )
}
