import Link from "next/link";
import styles from './FrontPageLayout.module.scss'
import SiteNavigationHeader from "@/components/templates/SiteNavigationHeader";
import Search from "@/components/search/Search";
import { useEffect, useRef } from "react";

export default function FrontPageLayout({ content }) {
    const titleRef = useRef(null);

    // Shenanigans! Making the CSS styling sensitive to the scroll position.
    useEffect(() => {
        const setScrollY = () => titleRef.current.style.setProperty('--scroll-y', window.scrollY);
        window.addEventListener('scroll', setScrollY);
        return () => window.removeEventListener('scroll', setScrollY);
    }, []);


    return (
        <div className={styles.frontpage}>
            <header className={styles.header}>
                <h1 ref={titleRef} className={styles.titleBanner}>
                    <Link href={'/'}>raser . io</Link>
                </h1>
                <SiteNavigationHeader/>
                <Search/>
            </header>
            <main className={styles.content}>
                {content}
            </main>
        </div>
    )
}
