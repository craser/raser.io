import styles from './TrailHeadCard.module.scss';
import MapsDao from '/model/MapsDao';

const mapsDao = new MapsDao();

export default function TrailHeadCard({ trail, hideTrailCard }) {
    let details = mapsDao.getTrail(); // TODO: make actual call
    let { title, date, duration, miles, climbingFeet } = details[0];

    return (
        <div className={styles.card} onClick={hideTrailCard}>
            <div>
                <h4>{title}</h4>
                <table>
                    <tr>
                        <th>Date:</th>
                        <td>{date}</td>
                    </tr>
                    <tr>
                        <th>Duration:</th>
                        <td>{duration}</td>
                    </tr>
                    <tr>
                        <th>Distance (mi):</th>
                        <td>{miles}</td>
                    </tr>
                    <tr>
                        <th>Climbing (ft):</th>
                        <td>{climbingFeet}</td>
                    </tr>
                    <tr>
                        <td><a>« zoom</a></td>
                        <td colSpan="2" align="right"><a>more »</a></td>
                    </tr>
                </table>
            </div>
        </div>
    );
}
