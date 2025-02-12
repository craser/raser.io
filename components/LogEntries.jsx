import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import styles from './LogEntries.module.scss';
import LoadingSpinner from "@/components/LoadingSpinner";
import PostViewContext, { View } from "@/components/PostViewContext";
import { useDataContext } from "@/components/api/DataProvider";
import { useAnalytics } from "@/components/analytics/AnalyticsContext";


export default function LogEntries({ initialPage = 0, pageSize, initialEntries }) {
    const analytics = useAnalytics();
    const dataContext = useDataContext();
    const [entries, setEntries] = useState(initialEntries || []);
    const [intersectionObserver, setIntersectionObserver] = useState(null);
    const [isLoading, setIsLoading] = useState(false); // for now, only controls spinner
    const pageBottomRef = useRef();

    useEffect(() => {
        analytics.firePageView('home');
    }, []);

    function isCsr() {
        const csr = `${typeof window}` !== 'undefined';
        return csr;
    }

    function loadPage(pageNumber) {
        console.log(`loading page ${pageNumber}`);
        const start = Date.now();
        setIsLoading(true);
        return dataContext.getPostDao().getEntries(pageNumber, pageSize)
            .then(page => {
                setEntries((entries) => [...entries, ...page]);
                setIsLoading(false);
            })
            .then(() => console.log(`fetched page ${pageNumber} in ${Date.now() - start}ms`))
            .catch(e => console.error(e));
    }


    useEffect(() => {
        if (!isCsr() || intersectionObserver) return;
        let pageNumber = initialPage;
        let loading = false;
        const observer = new IntersectionObserver((entries) => {
            if (entries.some(entry => entry.isIntersecting)) {
                // TODO: this is going to find the same value for pageNumber every time,
                // since it's a closure over the initial value of pageNumber. Need to fix this.
                if (!loading) {
                    loading = true;
                    loadPage(pageNumber++).then(() => loading = false);
                }
            }
        }, { threshold: 0.5 });
        setIntersectionObserver(observer);
        return () => observer.disconnect(); // cleanup
    }, [isCsr()]);


    useEffect(() => {
        if (pageBottomRef?.current && intersectionObserver) {
            const observer = intersectionObserver;
            observer.observe(pageBottomRef.current);
            return () => observer.disconnect();
        }
    }, [intersectionObserver, pageBottomRef.current]);

    return (
        <Fragment>
            {entries.map(e => <PostViewContext key={e.entryId} post={e} initialView={View.ENTRY_LIST}/>)}
            <div ref={pageBottomRef} className={styles.listingBottom}>{isLoading ? <LoadingSpinner/> : '• • •' }</div>
        </Fragment>
    );
}
