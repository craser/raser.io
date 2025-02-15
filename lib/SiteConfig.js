const config = require('../siteconfig.json')
import { formatString } from '@/lib/util/StringFormatter'

export default class SiteConfig {

    /**
     * There's some "magic" going on here. The Next.js build process
     * replaces "process.env.NEXT_PUBLIC_..." with values from
     * .env.production or .env.development depending on where it's
     * building. It does this textually, so they have to be the full
     * reference as below.
     *
     * @type {{NEXT_PUBLIC_API_ROOT: string}}
     */
    #processEnv = {
        NEXT_PUBLIC_API_ROOT: process.env.NEXT_PUBLIC_API_ROOT
    }

    #getConfigValue(name, obj = config) {
        return name.split('.').reduce((acc, n) => {
            return acc[n];
        }, obj);
    }

    getValue(name, values) {
        let property = this.#getConfigValue(name);
        if (typeof property === 'string') {
            let value = formatString(property, { ...this.#processEnv, ...values });
            return value;
        } else {
            return property;
        }
    }

    getEndpoint(name, values) {
        const rootTemplate = this.#getConfigValue('api.root');
        const pathTemplate = this.#getConfigValue(name, config.api.endpoints);
        const url = formatString(`${rootTemplate}${pathTemplate}`, { ...this.#processEnv, ...values });
        return url;
    }
}
