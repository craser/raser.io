import styles from './Modal.module.scss'

export default function Modal({ children }) {
    return (
        <div className={styles.backdrop}>
            <div className={styles.modal}>
                {children}
            </div>
        </div>
    )
}
