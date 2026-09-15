import SiteConfig from "@/lib/SiteConfig";
import { useEffect, useState } from "react";

export function MapImage({ fileName, className, onError }) {
    const siteConfig = new SiteConfig();
    const [imgSrc, setImgSrc] = useState();

    useEffect(() => {
        const url = siteConfig.getEndpoint('maps.mapimageuri', { fileName });
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Map image URI request failed: ${response.status}`);
                }
                return response.text();
            })
            .then(src => setImgSrc(src))
            .catch(error => console.error('Error fetching image source:', error));
    }, [fileName]);

    return <img src={imgSrc} alt={`Map ${fileName}`} className={className} onError={onError} data-testid="map-image" />;
}
