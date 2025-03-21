import Link from "next/link";
import styles from './FrontPageLayout.module.scss'
import SiteNavigationHeader from "@/components/templates/SiteNavigationHeader";
import Search from "@/components/search/Search";
import { useEffect, useRef } from "react";
import { debounce, inIdle } from "@/lib/util/wrappers";

export default function StandardLayout({ content }) {
    const headerRef = useRef(null);

    /**
     * Shenanigans! Making the CSS styling sensitive to the scroll position!
     * Using two different threshholds here to avoid silly bouncing header
     * When the header shrinks, even when it's sticky, this affects the
     * window's calculations as to scroll position. So, if we start with a
     * 200px-high header, and scrollY is 150, and we then shrink the header
     * to 80px high, the window will re-calculate scrollY to be 30px.
     */
    useEffect(() => {
        const setStuck = () => {
            if (window.scrollY > 100) {
                headerRef.current?.classList.add(styles.stuck);
            } else if (window.scrollY < 20) {
                headerRef.current?.classList.remove(styles.stuck);
            }
        }
        const setScrollY = debounce(inIdle(setStuck), 100);
        window.addEventListener('scroll', setScrollY, true);
        return () => window.removeEventListener('scroll', setScrollY);
    }, []);


    return (
        <div className={styles.frontpage}>
            <header ref={headerRef} className={styles.header}>
                <h1 className={styles.titleBanner}>
                    <Link href={'/'}>DeathB4Decaf</Link>
                </h1>
                <SiteNavigationHeader/>
            </header>
            <Search/>
            <main className={styles.content}>
                {content}
            </main>
        </div>
    )
}
