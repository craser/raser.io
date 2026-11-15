// ABOUTME: Infinite-scrolling list of posts, newest first, optionally limited to one tag.
// ABOUTME: An IntersectionObserver on the list's bottom loads the next page from the post DAO.
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './LogEntries.module.scss';
import LoadingSpinner from "@/components/LoadingSpinner";
import ReadPostView from "@/components/ReadPostView";
import { useDataContext } from "@/components/api/DataProvider";
import { useAnalytics } from "@/components/analytics/AnalyticsProvider";


/**
 * Lists posts newest first, loading another page each time the reader nears the bottom.
 * Given a tag, lists only the posts carrying that tag.
 */
export default function LogEntries({ initialPage = 0, pageSize, initialEntries, tag = null }) {
    const analytics = useAnalytics();
    const dataContext = useDataContext();
    const [entries, setEntries] = useState(initialEntries || []);
    const [isLoading, setIsLoading] = useState(false); // for now, only controls spinner
    const pageBottomRef = useRef();
    // Kept in refs so a re-created observer carries on from the right page.
    const nextPageRef = useRef(initialPage);
    const loadingRef = useRef(false);
    const isCsr = `${typeof window}` !== 'undefined';

    useEffect(() => {
        analytics.firePageView('home');
    }, [analytics]);


    const loadPage = useCallback((pageNumber) => {
        console.log(`loading page ${pageNumber}`);
        const start = Date.now();
        setIsLoading(true);
        const postDao = dataContext.getPostDao();
        const request = tag
            ? postDao.getEntriesByTag(tag, pageNumber, pageSize)
            : postDao.getEntries(pageNumber, pageSize);
        return request
            .then(page => {
                setEntries((entries) => [...entries, ...page]);
                setIsLoading(false);
            })
            .then(() => console.log(`fetched page ${pageNumber} in ${Date.now() - start}ms`))
            .catch(e => console.error(e));
    }, [setEntries, setIsLoading, dataContext, pageSize, tag]);

    useEffect(() => {
        if (!isCsr || !pageBottomRef.current) return;
        const observer = new IntersectionObserver((entries) => {
            if (entries.some(entry => entry.isIntersecting)) {
                if (!loadingRef.current) {
                    loadingRef.current = true;
                    loadPage(nextPageRef.current++).then(() => loadingRef.current = false);
                }
            }
        }, { threshold: 0.5 });
        observer.observe(pageBottomRef.current);
        return () => observer.disconnect(); // cleanup
    }, [isCsr, loadPage]);

    return (
        <Fragment>
            {entries.map(e => <ReadPostView key={e.entryId} post={e} showNextPrev={false}/>)}
            <div ref={pageBottomRef} className={styles.listingBottom}>{isLoading ? <LoadingSpinner/> : '• • •'}</div>
        </Fragment>
    );
}
