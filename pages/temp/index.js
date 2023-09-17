/*
 * Base Google Map example
 */
import React, { PropTypes, Component } from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';

import GoogleMap from 'google-map-react';

const K_WIDTH = 40;
const K_HEIGHT = 40;

const markerStyle = {
    // initially any map object has left top corner at lat lng coordinates
    // it's on you to set object origin to 0,0 coordinates
    position: 'absolute',
    width: K_WIDTH,
    height: K_HEIGHT,
    left: -K_WIDTH / 2,
    top: -K_HEIGHT / 2,

    border: '5px solid #f44336',
    borderRadius: K_HEIGHT,
    backgroundColor: 'white',
    textAlign: 'center',
    color: '#3f51b5',
    fontSize: 16,
    fontWeight: 'bold',
    padding: 4
};

const Marker = () => <div style={markerStyle}/>;

export default class SimpleMapPage extends Component {

    static defaultProps = {
        center: [59.938043, 30.337157],
        zoom: 9,
        greatPlaceCoords: { lat: 59.724465, lng: 30.080121 }
    };

    shouldComponentUpdate = shouldPureComponentUpdate;

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div style={{ height: '100vh', width: '100vw' }}>
                <GoogleMap
                    // apiKey={YOUR_GOOGLE_MAP_API_KEY} // set if you need stats etc ...
                    center={this.props.center}
                    zoom={this.props.zoom}>
                    <Marker lat={59.955413} lng={30.337844}/>
                </GoogleMap>
            </div>
        );
    }
}
