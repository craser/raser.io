import { useRef, useEffect, useState } from 'react';
import styles from './PageSection.module.scss';

export default function PageSection({ title, BgIcon, hero = false, children, className, ...props }) {

    const titleRef = useRef(null);
    const sectionRef = useRef(null);

    // Calculate base classes
    const baseClasses = hero ? [styles.pageSection, styles.hero] : [styles.pageSection];

    // Add dynamic class based on title length
    const classes = [className, ...baseClasses].join(' ');

    // Effect to measure title and adjust section height if needed
    useEffect(() => {
        if (hero) {
            return;
        } else if (titleRef.current && sectionRef.current) {
            // Set a CSS variable for the section to use in styling
            const titleWidth = titleRef.current.offsetWidth;
            sectionRef.current.style.setProperty('--title-width', `${titleWidth}px`);
        }
    }, [title, hero]);

    return (
        <section ref={sectionRef} data-testid="page-section" className={classes}>
            <div data-testid="page-section-title-container" className={styles.sectionTitleContainer}>
                <h2 ref={titleRef} data-testid="page-section-title" className={styles.sectionTitle}>{title}</h2>
            </div>
            {BgIcon &&
                <div data-testid="page-section-background" className={styles.sectionBackground}>
                    <BgIcon className={styles.icon} />
                </div>
            }
            <div data-testid="page-section-content" className={styles.contentWrapper}>
                {children}
            </div>
        </section>
    );
}
