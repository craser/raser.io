import styles from './PageSection.module.scss';

export default function PageSection({ title, BgIcon, hero = false, children, className, ...props }) {

    // Calculate base classes
    const baseClasses = hero ? [styles.pageSection, styles.hero] : [styles.pageSection];

    const classes = [className, ...baseClasses].join(' ');

    return (
        <section data-testid="page-section" className={classes}>
            <div data-testid="page-section-title-container" className={styles.sectionTitleContainer}>
                <h2 data-testid="page-section-title" className={styles.sectionTitle}>{title}</h2>
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
