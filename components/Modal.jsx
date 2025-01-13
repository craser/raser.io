import styles from './Modal.module.scss'

export default function Modal({ onDismiss, children }) {
    function dismiss() {
        try {
            onDismiss();
        } catch (e) {
            console.warn('error closing Modal', e);
        }
    }

    function dialogClicked(e) {
        e.stopPropagation();
    }

    return (
        <div className={styles.backdrop} onClick={dismiss}>
            <div className={styles.modal} onClick={dialogClicked}>
                {children}
            </div>
        </div>
    )
}
