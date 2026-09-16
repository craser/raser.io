// ABOUTME: Reads and writes generated map images in the CDN's storage zone.
// ABOUTME: The only place that knows the images are kept on Bunny; reach it via getInstance().

import SiteConfig from '@/lib/SiteConfig';

export default class MapImageStore {
    static #instance = null;

    static getInstance() {
        if (!MapImageStore.#instance) {
            MapImageStore.#instance = new MapImageStore();
        }
        return MapImageStore.#instance;
    }

    /**
     * Read fresh each time rather than at construction, so the shared instance
     * never pins configuration that was not yet loaded when it was created.
     */
    #config() {
        return new SiteConfig();
    }

    /**
     * Where the storage zone is written and read. This is a different host from
     * the public URL: the zone is the origin, and the CDN serves what it holds.
     */
    #getStorageUrl(name) {
        const config = this.#config();
        const host = config.getValue('maps.imageStore.host');
        const zone = config.getValue('maps.imageStore.zone');
        const path = config.getValue('maps.imageStore.path');
        return `https://${host}/${zone}/${path}/${name}`;
    }

    #getHeaders(extra = {}) {
        return {
            AccessKey: this.#config().getValue('maps.imageStore.accessKey'),
            ...extra
        };
    }

    /**
     * The URL a browser should load the image from.
     */
    getPublicUrl(name) {
        return this.#config().getValue('maps.imageStore.publicUrl', { name });
    }

    /**
     * Asks the storage zone directly rather than the public URL, so the answer
     * cannot come from a cached CDN miss.
     */
    async exists(name) {
        const response = await fetch(this.#getStorageUrl(name), {
            method: 'GET',
            headers: this.#getHeaders()
        });

        // Only the status matters here, so drop the body to keep it off the wire.
        response.body?.cancel?.();

        if (response.status === 404) {
            return false;
        }
        if (!response.ok) {
            throw new Error(`Unable to read ${name} from the map image store: ${response.status}`);
        }
        return true;
    }

    async save(name, bytes, contentType) {
        const response = await fetch(this.#getStorageUrl(name), {
            method: 'PUT',
            headers: this.#getHeaders({ 'Content-Type': contentType }),
            body: bytes
        });

        response.body?.cancel?.();

        if (!response.ok) {
            throw new Error(`Unable to store ${name} in the map image store: ${response.status}`);
        }
    }
}
