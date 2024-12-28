import SearchTrie from "@/lib/search/SearchTrie";


describe('SearchTrie', () => {

    it('Should accept string keys and objet values', () => {
        const trie = new SearchTrie();

        const a = { value: 'a' };
        const b = { value: 'ab' };
        const c = { value: 'abc'};


        [a, b, c].forEach(v => trie.insert(v.value, v));

        const values = trie.getValues();
        expect.assertions(3);
        [a, b, c].forEach(v => {
            expect(values.has(v)).toBe(true);
        });
    });

    it('Should return all possible completions', () => {
        const trie = new SearchTrie();
        trie.insert('ab', {}); // should include this one
        trie.insert('bx', {}); // should exclude this one
        trie.insert('ac', {}); // should include this one


        const completions = trie.getNode('a').getCompletions();
        expect(completions.has('b')).toBe(true);
        expect(completions.has('c')).toBe(true);
        expect(completions.has('x')).toBe(false);
    })

    it('Should accept multiple values for a single key', () => {
        const trie = new SearchTrie();
        trie.insert('a', 1);
        trie.insert('a', 2);
        trie.insert('a', 3);

        const values = trie.getValues();
        expect(values.size).toBe(3);
        expect(values.has(1)).toBe(true);
        expect(values.has(2)).toBe(true);
        expect(values.has(3)).toBe(true);
    })

    it('Should accept both single-value values and arrays', () => {
        const trie = new SearchTrie();
        trie.insert('a', 1);
        trie.insert('a', [2, 3]);

        const values = trie.getValues();
        expect(values.size).toBe(3);
        expect(values.has(1)).toBe(true);
        expect(values.has(2)).toBe(true);
        expect(values.has(3)).toBe(true);
    })

    it('Should return all possible values', () => {
        const trie = new SearchTrie();
        trie.insert('aaa', 1);
        trie.insert('abb', 2);
        trie.insert('abb', 3);
        trie.insert('abc', 4);

        const values = trie.getNode('ab').getValues();
        expect(values.size).toBe(3);
        expect(values.has(2)).toBe(true);
        expect(values.has(3)).toBe(true);
        expect(values.has(4)).toBe(true);
    })

    it('Should support getValues(key) as shorthand for getNode(key).getValues()', () => {
       const trie = new SearchTrie();
       trie.insert('aaa', 1);
       trie.insert('aaa', 2);

       const nodeValues = trie.getNode('aaa').getValues();
       const shortValues = trie.getValues('aaa');
       expect(nodeValues).toEqual(shortValues);
    });

    it('Should return empty set for getValues on an unmatched key', () => {
        const trie = new SearchTrie();
        trie.insert('aaa', 5);
        expect(trie.getValues('unmatched')).not.toBeNull();
        expect(trie.getValues('unmatched').size).toBe(0);
    })
})
