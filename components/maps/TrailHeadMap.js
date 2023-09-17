import GoogleMapReact from 'google-map-react';
import styles from './TrailHeadMap.module.scss'
import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";

const LOCATIONS = require('./TrailMapLocations.json');

const TrailHeadMarker = ({ text }) => <div className={styles.trailheadMarker}/>;

export default function TrailHeadMap() {

    let locations = LOCATIONS.locations;
    let options = {
        center: getCenter(LOCATIONS.bounds),
        zoom: 11
    }

    function getCenter(bounds) {
        return {
            lat: locations[0].location.lat,
            lng: locations[0].location.lon
        };

        let parsed = {};
        Object.keys(bounds).forEach(k => {
            parsed[k] = parseFloat(bounds[k]);
        })
        //return { lat: 10.99835602, lng: 77.01502627 };
        let x = (parsed.e + parsed.w) / 2;
        let y = (parsed.n + parsed.s) / 2;
        let center = { lat: y, lng: x };
        return center;
    }

    return (
        <div className={styles.trailheadmap} style={{ height: '100%', width: '100%' }}>
            <GoogleMapReact
                bootstrapURLKeys={{ key: "AIzaSyBOUra7aNY509z2Z8mitJjK4FUpU_oOy1A" }}
                defaultCenter={options.center}
                defaultZoom={options.zoom}
            >
                <TrailHeadMarker
                    lat={options.center.lat}
                    lng={options.center.lng}
                />
            </GoogleMapReact>
        </div>
    );
}
