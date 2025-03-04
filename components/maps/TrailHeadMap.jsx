import GoogleMapReact from 'google-map-react';
import styles from './TrailHeadMap.module.scss'
import { Fragment, useEffect, useState } from "react";
import TrailHeadCard from "@/components/maps/TrailHeadCard";

const DmgMap = require('/blog/maps/map');
const JSON_DATA = require('./TrailMapLocations.json'); // FIXME: Load from BACK END

export default function TrailHeadMap() {
    const GOOGLE_MAPS_API_KEY = "AIzaSyBOUra7aNY509z2Z8mitJjK4FUpU_oOy1A";
    const DEFAULT_CENTER = {
        "lat": 36.395806,
        "lng": -118.673095
    };
    const DEFAULT_ZOOM = 7;

    let [dataLoaded, setDataLoaded] = useState(false);
    let [locations, setLocations] = useState([]);
    let [bounds, setBounds] = useState({});
    let [mapApiLoaded, setMapApiLoaded] = useState(false);
    let [dmgMap, setDmgMap] = useState(null);
    let [expandedTrails, setExpandedTrails] = useState([]);
    let [marks, setMarks] = useState([]);
    console.log('RENDERING', { expandedTrails });

    function showTrailCard(t) {
        setExpandedTrails(expandedTrails.concat(t));
    }

    function hideTrailCard(trail) {
        setExpandedTrails(expandedTrails.filter(t => t.fileName != trail.fileName));
    }

    function getCenter(bounds) {
        return {
            lat: (bounds.n + bounds.s) / 2,
            lng: (bounds.e + bounds.w) / 2
        };
    }

    function renderData() {
        dmgMap.zoomToBounds(bounds);
        let marks = locations.map(l => {
            let mark = dmgMap.markLocation(l);
            mark.addListener('click', function() {
                this.dmgOnClick(l);
            });
            mark.dmgOnClick = showTrailCard; // init
            return mark;
        });
        setMarks(marks);
    }

    function assignMarkClickHandlers() {
        marks.forEach(m => m.dmgOnClick = showTrailCard);
    }

    function checkDataAndApiLoaded() {
        if (dataLoaded && mapApiLoaded) {
            console.info("Data & API loaded.", { dataLoaded, mapApiLoaded });
            renderData();
        } else {
            console.info("Data & API not yet loaded.", { dataLoaded, mapApiLoaded });
        }
    }

    function onGoogleApiLoaded({ map, maps }) {
        console.log({ map, maps });
        setDmgMap(new DmgMap(map, maps));
        setMapApiLoaded(true);
    }

    useEffect(() => {
        setDataLoaded(false);
        setTimeout(() => {
            console.log({ center: getCenter(JSON_DATA.bounds) });
            setBounds(JSON_DATA.bounds);
            setLocations(JSON_DATA.locations);
            setDataLoaded(true);
        }, 1000);
    }, []);

    useEffect(checkDataAndApiLoaded, [mapApiLoaded, dataLoaded]);

    assignMarkClickHandlers(); // keep things up-to-date

    return (
        <Fragment>
            <div className={styles.sidebar}>
                {expandedTrails.map(t => (
                    <TrailHeadCard
                        key={t.fileName}
                        trail={t}
                        hideTrailCard={() => hideTrailCard(t)}
                    />
                ))}
            </div>
            <div className={styles.trailheadmap} style={{ height: '100%', width: '100%' }}>
                <GoogleMapReact
                    bootstrapURLKeys={{ key: GOOGLE_MAPS_API_KEY }}
                    defaultCenter={DEFAULT_CENTER}
                    defaultZoom={DEFAULT_ZOOM}
                    yesIWantToUseGoogleMapApiInternals
                    onGoogleApiLoaded={onGoogleApiLoaded}
                />
            </div>
        </Fragment>
    );
}
