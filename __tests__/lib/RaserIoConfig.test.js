import { getEndpoint } from '@/lib/RaserIoConfig'


test('find real endpoint', () => {
    let endpoint = getEndpoint('entries.entry', { id: 1138 });
    expect(endpoint).toEqual('http://localhost:5000/entries/1138');
});

test('given value a.b.c in config, return that value', () => {

})
