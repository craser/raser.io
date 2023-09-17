import GoogleMapReact from 'google-map-react';
import styles from './TrailHeadMap.module.scss'
import { useEffect, useState } from "react";
const DmgMap = require('/blog/maps/map');

const LOCATIONS = require('./TrailMapLocations.json'); // FIXME: Load from BACK END

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

    function getCenter(bounds) {
        return {
            lat: (bounds.n + bounds.s) / 2,
            lng: (bounds.e + bounds.w) / 2
        };
    }

    function renderData() {
        dmgMap.zoomToBounds(bounds);
        locations.forEach(l => dmgMap.markLocation(l.location));
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
            console.log({center: getCenter(LOCATIONS.bounds)});
            setBounds(LOCATIONS.bounds);
            setLocations(LOCATIONS.locations);
            setDataLoaded(true);
        }, 1000);
    }, []);

    useEffect(checkDataAndApiLoaded, [mapApiLoaded, dataLoaded]);

    return (
        // Setting container dimensions explicitly - required by GoogleMapReact.
        <div className={styles.trailheadmap} style={{ height: '100%', width: '100%' }}>
            <GoogleMapReact
                bootstrapURLKeys={{ key: GOOGLE_MAPS_API_KEY }}
                defaultCenter={DEFAULT_CENTER}
                defaultZoom={DEFAULT_ZOOM}
                yesIWantToUseGoogleMapApiInternals
                onGoogleApiLoaded={onGoogleApiLoaded}
            />
        </div>
    );
}
