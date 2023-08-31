import Link from "next/link";
import styles from './FrontPageLayout.module.css'
import HeaderNavigationOptions from "@/components/templates/HeaderNavigationOptions";

export default function FrontPageLayout(props) {
    return (
        <div className={styles.frontpage}>
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
