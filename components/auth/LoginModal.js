import Modal from "@/components/Modal";
import styles from './LoginModal.module.scss'
import { useRef, useState } from "react";

export default function LoginModal({ login, hideLogin }) {

    const userRef = useRef();
    const passRef = useRef();
    const [errorMessage, setErrorMessage] = useState(null);

    function onSubmit(e) {
        e.preventDefault();
        const user = userRef.current.valueOf().value;
        const pass = passRef.current.valueOf().value;
        login(user, pass)
            .catch(error => {
                setErrorMessage('Email or password incorrect.');
            })
    }

    return (
        <Modal onDismiss={hideLogin}>
            <form onSubmit={onSubmit}>
                <div className={styles.logincontainer}>
                    <div className={styles.row}>
                        <input ref={userRef} type="text" placeholder="username" />
                    </div>
                    <div className={styles.row}>
                        <input ref={passRef} type="password" placeholder="password" />
                    </div>
                    {errorMessage ? <div className={styles.error}>{errorMessage}</div> : null}
                    <div className={styles.row}>
                        <button onClick={hideLogin}>CANCEL</button>
                        <button type="submit">Log In</button>
                    </div>
                </div>
            </form>
        </Modal>
    );
}
