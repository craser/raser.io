import React, { useEffect, useState } from 'react';
import Modal from "@/components/Modal";
import { render } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import ModalProvider from "@/components/modal/ModalProvider";

function ExampleComponent({ children }) {
    const [show, setShow] = useState(false);
    useEffect(() => {
        setShow(true);
    }, []);

    return (
        <>{show && children}</>
    )
}

function renderScaffold({ onDismiss = () => false }) {
    return render(
        <ModalProvider>
            <ExampleComponent>
                <Modal onDismiss={onDismiss}>
                    I want to be an Air Force Ranger!
                </Modal>
            </ExampleComponent>
        </ModalProvider>
    );
}

describe('Modal', () => {
    it('renders a modal', () => {
        const { getByText } = renderScaffold({});
        expect(getByText('I want to be an Air Force Ranger!')).not.toBeNull();
    });

    it('dismisses on backdrop click', async () => {
        const onDismiss = jest.fn();
        const { getByTestId } = renderScaffold({ onDismiss });
        await userEvent.click(getByTestId('modal-backdrop'));
        expect(onDismiss).toHaveBeenCalled();
    });

    it('dismisses on ESC key', async () => {
        const onDismiss = jest.fn();
        const { getByTestId } = renderScaffold({ onDismiss });
        await userEvent.type(getByTestId('modal-backdrop'), '{esc}');
        expect(onDismiss).toHaveBeenCalled();
    });

    it('stops propagation on dialog click', async () => {
        const onDismiss = jest.fn();
        const { getByText } = renderScaffold({ onDismiss });
        await userEvent.click(getByText('I want to be an Air Force Ranger!'));
        expect(onDismiss).not.toHaveBeenCalled();
    });

})
