import styles from './ToggleDemo.module.css'
import {useState} from "react";

export default function ToggleDemo(props) {
    const [activated, setActivated] = useState(false);

    function toggle() {
        console.log({ toggling: activated});
        setActivated(!activated);
    }

    return (
        <div className={styles.toggledemo}>
            <button onClick={toggle}>
                CLICK ME
            </button>
            <div className={activated ? styles.on : styles.off}>
                {activated ? 'ACTIVATED' : 'NOPE'}
            </div>
        </div>
    );
}
