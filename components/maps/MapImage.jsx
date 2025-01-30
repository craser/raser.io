export function MapImage({ fileName }) {
    const imagePath = `/images/maps/${fileName}`;
    return <img src={imagePath} alt={`Map ${fileName}`} className="map-image" />;
}
