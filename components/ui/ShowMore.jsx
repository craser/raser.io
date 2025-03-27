// FIXME: Replace with MUI asap.
import styles from './ShowMore.module.scss';
import { useRef, useState, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export default function ShowMore({ children }) {
    const [expanded, setExpanded] = useState(false);
    const contentContainerRef = useRef(null);
    const contentRef = useRef(null);

    const expand = () => {
        contentContainerRef.current.style.height = contentRef.current.clientHeight + 'px';
        setExpanded(true);
    }
    const collapse = () => {
        contentContainerRef.current.style.height = 0;
        setExpanded(false);
    }

    useEffect(collapse, []);

    return (
        <>
            {!expanded && <button className={styles.showMore} onClick={expand}><span>more</span><ChevronDown/></button>}
            <div ref={contentContainerRef} class={styles.content}>
                <div ref={contentRef}>
                    {children}
                </div>
            </div>
            {expanded && <button class={styles.showLess} onClick={collapse}><span>less</span><ChevronUp/></button>}
        </>
    );
}
