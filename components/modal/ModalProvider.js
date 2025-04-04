import { createContext, useContext, useRef } from "react";

const ModalContextObj = createContext({
    getModalRoot: () => null,
    getZIndex: () => 0,
})

export function useModalContext() {
    return useContext(ModalContextObj);
}

export default function ModalProvider({ children }) {
    const modalRoot = useRef(null);

    const context = {
        getModalRoot: () =>  modalRoot.current,
        getZIndex: () => 0,
    }

    return (
        <ModalContextObj.Provider value={context}>
            <section ref={modalRoot} data-testid="modal-portal"></section>
            {children}
        </ModalContextObj.Provider>
    )
}
