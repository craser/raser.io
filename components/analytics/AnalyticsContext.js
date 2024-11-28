import React from 'react';

export default function AnalyticsContext({ children }) {
    console.log('AnalyticsContext: loading statsig via script tag');
    return (
        <>
            <script async={true} src="https://cdn.jsdelivr.net/npm/@statsig/js-client@3/build/statsig-js-client+session-replay+web-analytics.min.js?apikey=client-1dApaPalDEFp7nvAG5NteYNbIIqfVjdIEPOkkQ2yoJZ">
            </script>
            {children}
        </>
    );
}
