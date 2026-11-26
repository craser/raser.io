import SiteConfig from "@/lib/SiteConfig";
import { useEffect, useState } from "react";
import { titleImageSizeProps } from "@/components/TitleImageSize";
import TitleImage from "@/components/TitleImage";

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

export function MapImage({ fileName, className, sizes, onError }) {
    const imgSrc = useMapImageSrc(fileName);
    const alt = `Map ${fileName}`;
    if (!imgSrc) {
        // next/image needs a src, so an empty <img> holds the box while the lookup runs (or after it fails).
        return <img alt={alt} {...titleImageSizeProps(className)} onError={onError} data-testid="map-image" />;
    }
    return <TitleImage src={imgSrc} alt={alt} className={className} sizes={sizes} onError={onError} data-testid="map-image" />;
}
