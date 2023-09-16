import { useRef } from "react";
import styles from "./Annotation.module.scss"


export default function AnnotationEntry(props) {
    let { addAnnotation, removeAnnotation } = props;
    let name = useRef();

    function onSubmit(e) {
        e.preventDefault();
    }

    function keyHandler(e) {
        console.log(e);
        if (e.nativeEvent.keyCode == 13) {// Enter
            let annotationName = name.current.value;
            addAnnotation(annotationName);
            name.current.value = '';
            name.current.focus();
        } else if (e.nativeEvent.keyCode == 8) { // Backspace
            if (name.current.value == '') {
                e.preventDefault();
                name.current.value = removeAnnotation();
            }
        }
    }

    return (
        <form className={styles.form} onSubmit={onSubmit}>
            <input ref={name} type="text" onKeyDown={keyHandler}/>
        </form>
    );

}
