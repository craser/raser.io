/*
 * Base Google Map example
 */

import GoogleMap from 'google-map-react';

const markerStyle = {
    padding: '25px',
    backgroundColor: 'fuchsia',
    borderRadius: '50%'
}

const Marker = () => <div style={markerStyle} />;

export default function SampleGoogleMapsPage() {
    return (
        <div style={{ height: '100vh', width: '100vw' }}>
            <GoogleMap
                center={[59.938043, 30.337157]}
                zoom={9}>
                <Marker lat={59.955413} lng={30.337844} />
            </GoogleMap>
        </div>
    );
}
