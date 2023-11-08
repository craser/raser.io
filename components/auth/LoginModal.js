import Modal from "@/components/Modal";
import styles from './LoginModal.module.scss'
import { useRef } from "react";

export default function LoginModal({ authenticate, hideLogin }) {

    const userRef = useRef();
    const passRef = useRef();

    function onSubmit(e) {
        e.preventDefault();
        const user = userRef.current.valueOf().value;
        const pass = passRef.current.valueOf().value;
        authenticate(user, pass);
    }

    return (
        <Modal>
            <form onSubmit={onSubmit}>
                <div className={styles.logincontainer}>
                    <div className={styles.row}>
                        <input ref={userRef} type="text" placeholder="username" />
                    </div>
                    <div className={styles.row}>
                        <input ref={passRef} type="password" placeholder="password" />
                    </div>
                    <div className={styles.row}>
                        <button onClick={hideLogin}>CANCEL</button>
                        <button onClick={authenticate}>Log In</button>
                    </div>
                </div>
            </form>
        </Modal>
    );
}
