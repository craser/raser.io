import { SiteConfig } from '@/lib/SiteConfig'

jest.mock('/siteconfig.json', () => ({
    images: {
        postcard: 'https://example.com/images/postcards/{imageFileName}'
    },
    api: {
        root: 'http://dummyhost.com',
        endpoints: {
            entries: {
                entry: '/fake-entry-endpoint/{id}'
            }
        }
    }
}))

test('get a formatted value', () => {
    let value = new SiteConfig().getValue('images.postcard', { imageFileName: 'bogus-image.jpg'})
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
