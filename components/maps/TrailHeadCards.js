import { Fragment } from "react";

export default function TrailHeadCards(props) {
    let trails = props.trails;
    let expandTrail = props.expandTrail;

    return (
        <Fragment>
            {trails.map(t => {
                return expandTrail
                    ? <div key={t.fileName} onClick={() => expandTrail(t)}>{t.fileName}</div>
                    : <div key={t.fileName}>{t.fileName}</div>
            })}
        </Fragment>
    );
}
