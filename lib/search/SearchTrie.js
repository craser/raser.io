export default class SearchTrie {
    constructor() {
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

    getCompletions() {
        let completions = new Set();
        if (this.values.size > 0) {
            completions.add('');
        }

        for (const child in this.children) {
            const c = this.children[child];
            c.getCompletions().forEach(suffix => completions.add(`${child}${suffix}`));
        }
        return completions;
    }

    getValues() {
        let values = new Set();
        this.values.forEach(v => values.add(v));
        for (const child in this.children) {
            const c = this.children[child];
            c.getValues().forEach(v => values.add(v));
        }
        return values;
    }
}
