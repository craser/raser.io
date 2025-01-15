import Link from "next/link";
import styles from './FrontPageLayout.module.scss'
import SiteNavigationHeader from "@/components/templates/SiteNavigationHeader";
import Search from "@/components/search/Search";
import { useEffect, useRef } from "react";

export default function FrontPageLayout({ content }) {
    const headerRef = useRef(null);

    // Shenanigans! Making the CSS styling sensitive to the scroll position.
    useEffect(() => {
        const setScrollY = () => headerRef.current.style.setProperty('--scroll-y', window.scrollY);
        window.addEventListener('scroll', setScrollY);
        return () => window.removeEventListener('scroll', setScrollY);
    }, []);


    return (
        <div className={styles.frontpage}>
            <header ref={headerRef} className={styles.header}>
                <div className={styles.headerContent}>
                    <h1 className={styles.titleBanner}>
                        <Link href={'/'}>raser . io</Link>
                    </h1>
                    <SiteNavigationHeader/>
                    <Search/>
                </div>
            </header>
            <main className={styles.content}>
                {content}
            </main>
        </div>
    )
}
