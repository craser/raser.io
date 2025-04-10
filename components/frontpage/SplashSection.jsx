import styles from './SplashSection.module.scss';

export default function PageSection({ children, ...props }) {

    return (
        <section className={styles.splashSection}>
            <div className={styles.contentWrapper}>
                {children}
            </div>
        </section>
    );
}
