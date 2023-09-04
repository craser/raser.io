import Link from "next/link";
import styles from './FrontPageLayout.module.css'
import HeaderNavigationOptions from "@/components/templates/HeaderNavigationOptions";
import EntryCacheContext from "@/components/context/EntryCacheContext";

export default function FrontPageLayout(props) {
    return (
        <EntryCacheContext.Provider value={{}}>
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
        </EntryCacheContext.Provider>
    )
}
