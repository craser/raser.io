import styles from "./Annotation.module.scss"

export default function Annotation({ name }) {
    return (
        <div className={styles.annotation}>{name}</div>
    );
}
