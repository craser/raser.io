import styles from './PageSection.module.scss';

export default function PageSection({ title, BgIcon, children }) {
    return (
        <section className={styles.pageSection}>
            <h2 className={styles.sectionTitle}>{title}</h2>
            <div className={styles.sectionBackground}>
                <BgIcon className={styles.icon}/>
            </div>
            {children}
        </section>
    );
}
