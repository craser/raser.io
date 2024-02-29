const config = require('../siteconfig.json')
import formatString from '@/lib/util/StringFormatter'

/**
 * @deprecated - use class RaserIoConfig instead.
 *
 * @returns {{api: {root: string, endpoints: {postcards: string, auth: {login: string, check: string}, entries: {create: string, delete: string, entry: string, latest: string, next: string, previous: string, publish: string, update: string}}}}}
 */
export default function getConfig() {
    return config;
}

export class SiteConfig {

    getValue(name, obj = config) {
        return name.split('.').reduce((acc, n) => {
            return acc[n];
        }, obj);
    }

    getEndpoint(name, values) {
        const pathTemplate = this.getValue(name, config.api.endpoints);
        const path = formatString(pathTemplate, values);
        const url = `${config.api.root}${path}`;
        return url;
    }
}
