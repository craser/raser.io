import SiteConfig from '@/lib/SiteConfig'

jest.mock('/siteconfig.json', () => ({
    images: {
        postcard: 'https://example.com/images/postcards/{imageFileName}'
    },
    spotify: {
        clientId: '{SPOTIFY_CLIENT_ID}',
        clientSecret: '{SPOTIFY_CLIENT_SECRET}',
        refreshToken: '{SPOTIFY_REFRESH_TOKEN}',
        endpoints: {
            recent: '/api/spotify/recent'
        }
    },
    api: {
        root: '{NEXT_PUBLIC_API_ROOT}',
        endpoints: {
            entries: {
                entry: '/fake-entry-endpoint/{id}'
            }
        }
    }
}))

describe('SiteConfig', () => {

    beforeEach(() => {
        global.process.env = {
            NEXT_PUBLIC_API_ROOT: 'http://dummyhost.com'
        };
    });

    test('get a formatted value', () => {
        let value = new SiteConfig().getValue('images.postcard', { imageFileName: 'bogus-image.jpg' })
        expect(value).toBe('https://example.com/images/postcards/bogus-image.jpg');
    })

    test('given value a.b.c in config, return that value', () => {
        let value = new SiteConfig().getValue('api.root');
        expect(value).toBe('http://dummyhost.com');
    })

    test('find real endpoint', () => {
        let endpoint = new SiteConfig().getEndpoint('entries.entry', { id: 1138 });
        expect(endpoint).toEqual('http://dummyhost.com/fake-entry-endpoint/1138');
    });

    test('return an object as a value', () => {
        const EXPECTED = {
            entries: {
                entry: '/fake-entry-endpoint/{id}'
            }
        };
        let actual = new SiteConfig().getValue('api.endpoints');
        expect(actual).toEqual(EXPECTED);
    });

    test('reads the Spotify credentials from the environment', () => {
        global.process.env = {
            SPOTIFY_CLIENT_ID: 'spotify-id',
            SPOTIFY_CLIENT_SECRET: 'spotify-secret',
            SPOTIFY_REFRESH_TOKEN: 'spotify-refresh'
        };
        const config = new SiteConfig();

        expect(config.getValue('spotify.clientId')).toBe('spotify-id');
        expect(config.getValue('spotify.clientSecret')).toBe('spotify-secret');
        expect(config.getValue('spotify.refreshToken')).toBe('spotify-refresh');
    });

    test('knows the Spotify recent tracks endpoint', () => {
        expect(new SiteConfig().getValue('spotify.endpoints.recent')).toBe('/api/spotify/recent');
    });

});
