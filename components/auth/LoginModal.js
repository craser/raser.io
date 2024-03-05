import Modal from "@/components/Modal";
import styles from './LoginModal.module.scss'
import { useEffect, useRef, useState } from "react";
import { useAuthenticationContext } from "@/components/auth/AuthenticationContext";
import { auth } from "mysql/lib/protocol/Auth";

/**
 *
 * @param type
 * @param ref
 * @param placeholder
 * @param defaultValue
 * @param validate - function that either returns false if the field is valid, or an error string.
 * @returns {JSX.Element}
 * @constructor
 */
function LoginField({ type, placeholder, defaultValue, validate: validateValue, setValue }) {
    const ref = useRef();
    const [visited, setVisited] = useState(false);
    let [errorMessage, setErrorMessage] = useState(null);


    function validate() {
        if (visited) {
            let value = ref.current.valueOf().value;
            setValue(value);
            setErrorMessage(validateValue(value));
        }
    }

    return <>
        <input ref={ref} type={type} placeholder={placeholder} defaultValue={defaultValue} onChange={validate} onBlur={validate} onFocus={() => setVisited(true)}/>
        {errorMessage && <div className={styles.error}>{errorMessage}</div>}
    </>;
}

export default function LoginModal({ onVisibilityChange }) {
    const authContext = useAuthenticationContext();
    const [email, setEmail] = useState(authContext.getEmail);
    const [pass, setPass] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const [visible, setVisible] = useState(!authContext.isAuthenticated);

    function validateUserField(user) {
        if (!user) {
            return "required field";
        } else {
            return false;
        }
    }

    function onSubmit(e) {
        e.preventDefault();
        authContext.login(email, pass)
            .then(() => setVisible(false))
            .catch(error => {
                setErrorMessage('Email or password incorrect.');
            })
    }

    useEffect(() => {
        onVisibilityChange(visible);
    }, [visible]);

    if (!visible) {
        return null;
    } else {
        return (
            <Modal onDismiss={() => setVisible(false)}>
                <form onSubmit={onSubmit}>
                    <div className={styles.logincontainer}>
                        <div className={styles.row}>
                            <LoginField
                                type="text"
                                placeholder="email"
                                defaultValue={email}
                                validate={validateUserField}
                                setValue={setEmail}
                            />
                        </div>
                        <div className={styles.row}>
                            <LoginField
                                type="password"
                                placeholder="password"
                                validate={validateUserField}
                                setValue={setPass}
                            />
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
