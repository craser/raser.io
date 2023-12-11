import Modal from "@/components/Modal";
import styles from './LoginModal.module.scss'
import { useRef, useState } from "react";
import { useAuthenticationContext } from "@/components/auth/AuthenticationContext";

export default function LoginModal() {
    // { visible, login, hideLogin }
    const authContext = useAuthenticationContext();
    const userRef = useRef();
    const passRef = useRef();
    const [errorMessage, setErrorMessage] = useState(null);
    const [visible, setVisible] = useState(!authContext.isLoggedIn);

    function onSubmit(e) {
        e.preventDefault();
        const user = userRef.current.valueOf().value;
        const pass = passRef.current.valueOf().value;
        authContext.login(user, pass)
            .then(() => setVisible(false))
            .catch(error => {
                setErrorMessage('Email or password incorrect.');
            })
    }

    if (!visible) {
        return null;
    } else {
        return (
            <Modal onDismiss={() => setVisible(false)}>
                <form onSubmit={onSubmit}>
                    <div className={styles.logincontainer}>
                        <div className={styles.row}>
                            <input ref={userRef} type="text" placeholder="email" defaultValue={authContext.getEmail()}/>
                        </div>
                        <div className={styles.row}>
                            <input ref={passRef} type="password" placeholder="password"/>
                        </div>
                        {errorMessage ? <div className={styles.error}>{errorMessage}</div> : null}
                        <div className={styles.row}>
                            <button type="submit">Log In</button>
                        </div>
                    </div>
                </form>
            </Modal>
        );
    }
}
