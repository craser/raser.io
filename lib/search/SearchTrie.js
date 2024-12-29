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
