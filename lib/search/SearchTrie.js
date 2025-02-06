import { setUnion } from "@/lib/search/SetUtils";

export default class SearchTrie {
    constructor() {
        this.key = null;
        this.children = {};
        this.values = new Set();
    }

    insert(key, value) {
        value = (value instanceof Array)
            ? value
            : [value];
        let node = this;
        for (const char of key) {
            if (!node.children[char]) {
                node.children[char] = new SearchTrie();
            }
            node = node.children[char];
        }
        node.key = key;
        value.forEach(v => node.values.add(v));
    }

    getNode(key) {
        let node = this;
        for (const char of key) {
            if (!node.children[char]) {
                return null;
            } else {
                node = node.children[char];
            }
        }
        return node;
    }

    getMostCommonCompletion(key) {
        let completion = '';
        let count = this.values.size;

        let node = key ? this.getNode(key) : this;
        if (node) {
            for (const child in node.children) {
                let { completion: suffix, count: n } = node.children[child].getMostCommonCompletion();
                if (n > count) {
                    completion = `${child}${suffix}`;
                    count = n;
                }
            }
        }

        return { completion, count };
    }

    getCompletionsWithValues(key) {
        let completions = [];
        if (this.values.size > 0) {
            completions.push({ completion: '', values: this.values });
        }

        let node = key ? this.getNode(key) : this;
        if (node) {
            const cs = Object.entries(node.children).map(([letter, child]) => {
                const childCompletions = child.getCompletionsWithValues();
                return childCompletions.map(({ completion, values }) => ({
                    completion: `${letter}${completion}`,
                    values
                }));
            })
                .flat()
            cs.forEach(c => completions.push(c));
        }
        return completions;
    }

    getCompletions(key) {
        let completions = new Set();
        if (this.values.size > 0) {
            completions.add('');
        }

        let node = key ? this.getNode(key) : this;
        if (node) {
            for (const child in node.children) {
                const c = node.children[child];
                c.getCompletions().forEach(suffix => completions.add(`${child}${suffix}`));
            }
        }
        return completions;
    }

    /**
     * We need a way to associate the returned posts with the matched words from those posts.
     *
     * @param key
     * @return { [post id]: Set of words }
     */
    getMatchedValues(key) {
        const matchedValues = {}; // id -> Set of words
        const node = key ? this.getNode(key) : this;
        if (node) {
            node.values.forEach((id) => {
                if (id in matchedValues) {
                    matchedValues[id].add(node.key);
                } else {
                    matchedValues[id] = new Set([node.key]);
                }
            });

            for (const c in node.children) {
                const child = node.children[c];
                const mv = child.getMatchedValues();
                Object.entries(mv).forEach(([id, words]) => {
                    if (id in matchedValues) {
                        matchedValues[id] = setUnion(matchedValues[id], words);
                    } else {
                        matchedValues[id] = words;
                    }
                });
            }
        }
        return matchedValues;
    }

    getValues(key) {
        let values = new Set();
        let node = key ? this.getNode(key) : this;
        if (node) {
            node.values.forEach(v => values.add(v));
            for (const child in node.children) {
                const c = node.children[child];
                c.getValues().forEach(v => values.add(v));
            }
        }
        return values;
    }
}
