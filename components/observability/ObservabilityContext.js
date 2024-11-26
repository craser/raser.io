import { SiteConfig } from "@/lib/SiteConfig";
import { HoneycombWebSDK } from '@honeycombio/opentelemetry-web';
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';
import { useEffect, useState } from "react";

const honeycombConfig = new SiteConfig().getValue('honeycomb');

const configDefaults = {
    ignoreNetworkEvents: true,
    // propagateTraceHeaderCorsUrls: [
    // /.+/g, // Regex to match your backend URLs. Update to the domains you wish to include.
    // ]
};

function initSdk() {
    const sdk = new HoneycombWebSDK({
        // endpoint: "https://api.eu1.honeycomb.io/v1/traces", // Send to EU instance of Honeycomb. Defaults to sending to US instance.
        debug: true, // Set to false for production environment.
        ...honeycombConfig, // contains apiKey & serviceName

        // apiKey: '[YOUR API KEY HERE]', // Replace with your Honeycomb Ingest API Key.
        // serviceName: '[YOUR APPLICATION NAME HERE]', // Replace with your application name. Honeycomb uses this string

        // to find your dataset when we receive your data. When no matching dataset exists, we create a new one with this name if your API Key has the appropriate permissions.
        instrumentations: [getWebAutoInstrumentations({
            // Loads custom configuration for xml-http-request instrumentation.
            '@opentelemetry/instrumentation-xml-http-request': configDefaults,
            '@opentelemetry/instrumentation-fetch': configDefaults,
            '@opentelemetry/instrumentation-document-load': configDefaults,
        })],
    });
    sdk.start();
    return sdk;
}

export default function ObservabilityContext({ children }) {
    const [sdk, setSdk] = useState(null);
    useEffect(() => {
        if (!sdk) {
            console.log('ObservabilityContext: initializing Honeycomb SDK');
            if (typeof window !== 'undefined') {
                window && window.document && setSdk(initSdk())
            }
        }
    }, [typeof window]);

    return (
        <>
            {children}
        </>
    );
}
