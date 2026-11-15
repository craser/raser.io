// ABOUTME: Hides its children behind a "more" button and reveals them by animating the container's height.
// ABOUTME: Collapsing sets the height back to zero.
// FIXME: Replace with MUI asap.
import styles from './ShowMore.module.scss';
import { useRef, useState, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export default function ShowMore({ children }) {
    const [expanded, setExpanded] = useState(false);
    const contentContainerRef = useRef(null);
    const contentRef = useRef(null);

    const setContainerHeight = (height) => {
        contentContainerRef.current.style.height = height;
    }
    const expand = () => {
        setContainerHeight(contentRef.current.clientHeight + 'px');
        setExpanded(true);
    }
    const collapse = () => {
        setContainerHeight(0);
        setExpanded(false);
    }

    // Start collapsed. expanded already starts false, so only the container needs sizing.
    useEffect(() => setContainerHeight(0), []);

    return (
        <>
            {!expanded && <button data-testid="show-more" className={styles.showMore} onClick={expand}><span>more</span><ChevronDown/></button>}
            <div ref={contentContainerRef} data-testid="show-more-content" className={styles.content}>
                <div ref={contentRef}>
                    {children}
                </div>
            </div>
            {expanded && <button data-testid="show-less" className={styles.showLess} onClick={collapse}><span>less</span><ChevronUp/></button>}
        </>
    );
}
