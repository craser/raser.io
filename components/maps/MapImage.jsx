import SiteConfig from "@/lib/SiteConfig";
import { useEffect, useState } from "react";

/**
 * Looks up the URL of the map image for a GPX file. Returns undefined until the
 * lookup finishes, and null if it fails. Pass no fileName to skip the lookup.
 */
export function useMapImageSrc(fileName) {
    const [imgSrc, setImgSrc] = useState();

    useEffect(() => {
        if (!fileName) {
            return;
        }
        const url = new SiteConfig().getEndpoint('maps.mapimageuri', { fileName });
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Map image URI request failed: ${response.status}`);
                }
                return response.text();
            })
            .then(src => setImgSrc(src))
            .catch(error => {
                console.error('Error fetching image source:', error);
                setImgSrc(null);
            });
    }, [fileName]);

    return imgSrc;
}

export function MapImage({ fileName, className, onError }) {
    const imgSrc = useMapImageSrc(fileName);
    return <img src={imgSrc ?? undefined} alt={`Map ${fileName}`} className={className} onError={onError} data-testid="map-image" />;
}
