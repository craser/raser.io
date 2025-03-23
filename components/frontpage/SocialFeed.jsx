import styles from './SocialFeed.module.scss';

export function SocialFeed() {
    return (
        <section className={styles.socialSection}>
            <h2>Recent Social Activity</h2>
            <p>Here's what I've been up to lately:</p>
            <ul>
                <li>Posted a new blog entry: <a href="https://raser.io/blog/2021/08/01/this-is-a-test">This is a test</a></li>
            </ul>
        </section>
    );
}
