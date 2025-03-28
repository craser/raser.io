import styles from './Modal.module.scss'

/**
 * Creates a modal dialog. Dismisses on ESC or clicking outside backdrop.
 * @param onDismiss
 * @param children
 * @returns {JSX.Element}
 * @constructor
 */
export default function Modal({ onDismiss, children }) {

    // Stop clicks from propagating to the backdrop - the backdrop will interpret them as dismissal.
    function dialogClicked(e) {
        e.stopPropagation();
    }

    //
    function onKeyDown(e) {
        if (e.key === 'Escape') {
            onDismiss();
        }
    }

    return (
        <div data-testid="modal-backdrop" className={styles.backdrop} onClick={onDismiss} onKeyDown={onKeyDown}>
            <div data-testid="modal-content" className={styles.modal} onClick={dialogClicked} onKeyDown={onKeyDown}>
                {children}
            </div>
        </div>
    )
}
