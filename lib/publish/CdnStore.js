// ABOUTME: Lists, uploads and deletes files at the root of the Bunny CDN storage zone for the publisher.
// ABOUTME: Configured explicitly from PUBLISH_BUNNY_* values, never from the app's configuration.

import PublishError from '@/lib/publish/PublishError';

export default class CdnStore {
    #host;
    #zone;
    #accessKey;
    #fetch;

    constructor({ host, zone, accessKey, fetch = globalThis.fetch }) {
        this.#host = host;
        this.#zone = zone;
        this.#accessKey = accessKey;
        this.#fetch = fetch;
    }

    /**
     * @returns {Promise<Map<string, (string|null)>>} file name → upper-case SHA-256, for files at the zone root
     */
    async list() {
        const response = await this.#fetch(this.#url(''), {
            headers: { AccessKey: this.#accessKey, Accept: 'application/json' }
        });
        if (!response.ok) {
            throw new PublishError(`Could not list the CDN storage zone: HTTP ${response.status}. Check the Bunny values in 1Password.`);
        }
        const listing = new Map();
        for (const object of await response.json()) {
            if (!object.IsDirectory) {
                listing.set(object.ObjectName, object.Checksum ? object.Checksum.toUpperCase() : null);
            }
        }
        return listing;
    }

    async upload(name, bytes, contentType) {
        const response = await this.#fetch(this.#url(name), {
            method: 'PUT',
            headers: { AccessKey: this.#accessKey, 'Content-Type': contentType },
            body: bytes
        });
        response.body?.cancel?.();
        if (!response.ok) {
            throw new PublishError(`Upload of ${name} failed: HTTP ${response.status}.`);
        }
    }

    /**
     * Removes a file from the zone root. A file that is already gone counts as deleted.
     */
    async delete(name) {
        const response = await this.#fetch(this.#url(name), {
            method: 'DELETE',
            headers: { AccessKey: this.#accessKey }
        });
        response.body?.cancel?.();
        if (!response.ok && response.status !== 404) {
            throw new PublishError(`Delete of ${name} failed: HTTP ${response.status}.`);
        }
    }

    #url(name) {
        return `https://${this.#host}/${this.#zone}/${encodeURIComponent(name)}`;
    }
}
