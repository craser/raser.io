import Annotation from "@/components/temp/Annotation";
import { Fragment } from "react";

export default function AnnotationList(props) {
    let annotations = props.annotations;
    return (
        <Fragment>
            {annotations && annotations.map((a, i) => <Annotation key={`${a}_${i}`} name={a}/>)}
        </Fragment>
    );
}
