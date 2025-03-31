import styles from './Modal.module.scss'
import { createPortal } from "react-dom";
import { useModalContext } from "@/components/modal/ModalProvider";
import { useEffect, useState } from "react";

/**
 * Creates a modal dialog. Dismisses on ESC or clicking outside backdrop.
 * @param onDismiss
 * @param children
 * @returns {JSX.Element}
 * @constructor
 */
export default function Modal({ onDismiss, children, ...props }) {
    const modalRoot = useModalContext().getModalRoot();
    const [loaded, setLoaded] = useState(false);

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

    useEffect(() => {
        setLoaded(true);
    }, [modalRoot])

    if (!loaded) {
        return null;
    } else {
        const modalClassName = [styles.modal, props?.className].join(' ');
        return (
            <>
                {createPortal(
                    <div data-testid="modal-backdrop" className={styles.backdrop} onClick={onDismiss} onKeyDown={onKeyDown}>
                        <div data-testid="modal-content" className={modalClassName} onClick={dialogClicked} onKeyDown={onKeyDown}>
                            {children}
                        </div>
                    </div>,
                    modalRoot
                )}
            </>
        )
    }
}
