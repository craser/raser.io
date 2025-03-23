import styles from './PageSection.module.scss';

export default function PageSection({ title, BgIcon, hero = false, children }) {
    const classes = hero ? [styles.pageSection, styles.hero].join(' ') : styles.pageSection;
    return (
        <section className={classes}>
            <h2 className={styles.sectionTitle}>{title}</h2>
            {BgIcon &&
            <div className={styles.sectionBackground}>
                <BgIcon className={styles.icon}/>
            </div>
            }
            {children}
        </section>
    );
}
