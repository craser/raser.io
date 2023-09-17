import { Fragment } from "react";

export default function TrailHeadCards(props) {
    let trails  = props.trails;

    return (
        <ul>
            {trails.map(t => <div key={t.fileName}>{t.fileName}</div>)}
        </ul>
    );
}
