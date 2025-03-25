import { createContext, useContext, useRef } from "react";

const ModalContextObj = createContext({
    getModalRoot: () => null,
})

export function useModalContext() {
    return useContext(ModalContextObj);
}

export function ModalProvider({ children }) {
    const modalRoot = useRef(null);

    return (
        <ModalContextObj.Provider value={{ getModalRoot: () => modalRoot.current }}>
            <section ref={modalRoot} data-testid="modal-portal" style={{ zIndex: 1 }}></section>
            <section style={{ zIndex: 0 }}>
                {children}
            </section>
        </ModalContextObj.Provider>
    )
}
