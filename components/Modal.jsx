/**
 * Creates a modal dialog. Dismisses on ESC or clicking outside backdrop.
 * @param onDismiss
 * @param children
 * @returns {JSX.Element}
 * @constructor
 */
export default function Modal({ onDismiss, children }) {
    function dialogClicked(e) {
        e.stopPropagation();
    }

    function onKeyDown(e) {
        if (e.key === 'Escape') {
            onDismiss();
        }
    }

    return (
        <div
            data-testid="modal-backdrop"
            className="absolute h-full w-full bg-black/80 z-[1]"
            onClick={onDismiss}
            onKeyDown={onKeyDown}
        >
            <div
                data-testid="modal-content"
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-8 rounded-[11px] shadow-[9px_15px_20px_#111] max-h-screen max-w-screen"
                onClick={dialogClicked}
                onKeyDown={onKeyDown}
            >
                {children}
            </div>
        </div>
    )
}
