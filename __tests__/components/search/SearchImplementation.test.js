import search from '@/lib/search/SearchImplementation';
import { MOCK_STUBS } from './MockSearchStubs';


describe('Blog Post Search Implementation', () => {

    test('Should return only first entry, with "commonthree" as completion', () => {
        const results = search('commonth', MOCK_STUBS);
        expect(results).not.toBeNull();
        expect(results.results.length == 1);
        expect(results.results[0].intro).toContainEqual('commonth');
    });

});
