const config = require('../siteconfig.json')
import { formatString } from '@/lib/util/StringFormatter'

/**
 * @deprecated - use class RaserIoConfig instead.
 *
 * @returns {{api: {root: string, endpoints: {postcards: string, auth: {login: string, check: string}, entries:
 *     {create: string, delete: string, entry: string, latest: string, next: string, previous: string, publish: string,
 *     update: string}}}}}
 */
export default function getConfig() {
    return config;
}

export class SiteConfig {

    #processEnv = {
        NEXT_PUBLIC_API_ROOT: process.env.NEXT_PUBLIC_API_ROOT
    }

    #getConfigValue(name, obj = config) {
        return name.split('.').reduce((acc, n) => {
            return acc[n];
        }, obj);
    }

    getValue(name, values) {
        let template = this.#getConfigValue(name);
        let value = formatString(template, { ...this.#processEnv, ...values });
        return value;
    }

    getEndpoint(name, values) {
        const rootTemplate = this.#getConfigValue('api.root');
        const pathTemplate = this.#getConfigValue(name, config.api.endpoints);
        const url = formatString(`${rootTemplate}${pathTemplate}`, { ...this.#processEnv, ...values });
        return url;
    }
}
