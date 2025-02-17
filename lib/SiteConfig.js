import * as nodeAmplitude from '@amplitude/analytics-node';
import { formatString } from '@/lib/util/StringFormatter'

const SITE_CONFIG = {
    "images": {
        "postcard": "https://raserio.b-cdn.net/{imageFileName}"
    },
    "api": {
        "root": "{NEXT_PUBLIC_API_ROOT}",
        "endpoints": {
            "auth": {
                "login": "/auth/login?email={email}&pass={pass}",
                "check": "/auth/check?email={email}&token={token}"
            },
            "entries": {
                "create": "/entries/create",
                "delete": "/delete?id={id}&auth={authToken}",
                "entry": "/entries/{id}",
                "latest": "/entries/latest/{page}?pageSize={pageSize}",
                "next": "/entries/{id}/next",
                "previous": "/entries/{id}/prev",
                "publish": "/entries/publish",
                "update": "/entries/update",
                "bulk": "/entries/search/{numEntries}"
            },
            "maps": {
                "mapimageuri": "/attachments/maps/mapimageuri/{fileName}"
            }
        }
    },
    "honeycomb": {
        "apiKey": "hcaik_01jdn2n65j7kfecwmt3902a9gm72gassb392gvxkhxvzbw5gd1nb61zzv5",
        "serviceName": "raser.io"
    },
    "amplitude": {
        "enabled": "{NEXT_PUBLIC_API_ROOT}",
        "apiKey": "fb41a11b2a1da56f45839d940d5c28b0",
        "browser": {
            "options": {
                "autocapture": true
            }
        },
        "server": {
            "options": {
                "logLevel": amplitude.Types.LogLevel.Warn,
            }
        }
    }
}


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
        NEXT_PUBLIC_API_ROOT: process.env.NEXT_PUBLIC_API_ROOT,
        NEXT_PUBLIC_ANALYTICS_ENABLED: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED,
    }

    #getConfigValue(name, obj = SITE_CONFIG) {
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
