import { SiteConfig } from '@/lib/SiteConfig'

jest.mock('/siteconfig.json', () => ({
    api: {
        root: 'http://dummyhost.com',
        endpoints: {
            entries: {
                entry: '/fake-entry-endpoint/{id}'
            }
        }
    }
}))


test('given value a.b.c in config, return that value', () => {
    let value = new SiteConfig().getValue('api.root');
    expect(value).toBe('http://dummyhost.com');
})

test('find real endpoint', () => {
    let endpoint = new SiteConfig().getEndpoint('entries.entry', { id: 1138 });
    expect(endpoint).toEqual('http://dummyhost.com/fake-entry-endpoint/1138');
});
