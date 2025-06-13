import styles from './SingleSectionContent.module.scss';

export default function SingleSectionContent({ content }) {
    return (
        <section className={styles.singleSectionContent}>
            {content}
        </section>
    )
}
