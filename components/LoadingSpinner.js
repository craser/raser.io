import {Fragment} from "react";
import {ColorRing} from "react-loader-spinner";
import styles from './LoadingSpinner.module.css';

export default function LoadingSpinner(props) {
    return (
        <div className={styles.spinner}>
            <ColorRing
                visible={true}
                height="80"
                width="80"
                ariaLabel="blocks-loading"
                wrapperStyle={{}}
                wrapperClass="blocks-wrapper"
                colors={['#e15b64', '#f47e60', '#f8b26a', '#abbd81', '#849b87']}
            />
        </div>
    );
}
