import Annotation from "@/components/temp/Annotation";
import AnnotationEntry from "@/components/temp/AnnotationEntry";
import { useState } from "react";
import AnnotationList from "@/components/temp/AnnotationList";

export default function AnnotationContainer(props) {
    let [ annotations, setAnnotations ] = useState([]);

    function addAnnotation(annotation) {
        setAnnotations(annotations.concat(annotation));
    }

    function removeAnnotation() {
        if (annotations.length > 0) {
            let annotation = annotations.slice(-1)[0]; // last
            setAnnotations(annotations.slice(0, -1)); // all but last
            return annotation;
        } else {
            return '';
        }
    }

    return (
        <div>
            <AnnotationList annotations={annotations} />
            <AnnotationEntry addAnnotation={addAnnotation} removeAnnotation={removeAnnotation}/>
        </div>
    );
}
