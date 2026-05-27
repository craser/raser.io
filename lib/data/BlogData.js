// ABOUTME: Server-side singleton providing indexed, in-memory access to blog data.
// ABOUTME: Loaded from data/posts.json at first use; call BlogData.getInstance().

import fs from 'fs';
import path from 'path';

export default class BlogData {
    static #instance = null;

    #posts = [];
    #postsById = new Map();
    #postOrder = [];
    #postIndexById = new Map();

    static getInstance() {
        if (!BlogData.#instance) {
            BlogData.#instance = new BlogData();
        }
        return BlogData.#instance;
    }

    constructor() {
        const filepath = path.join(process.cwd(), 'data', 'posts.json');
        const raw = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
        this.#posts = [...raw].sort(
            (a, b) => new Date(b.datePosted) - new Date(a.datePosted)
        );
        this.#posts.forEach(post => {
            this.#postsById.set(String(post.entryId), post);
        });
        this.#postOrder = this.#posts.map(p => String(p.entryId));
        this.#postOrder.forEach((id, idx) => this.#postIndexById.set(id, idx));
    }

    getEntries(page = 0, pageSize = 10) {
        const start = page * pageSize;
        return this.#posts.slice(start, start + pageSize);
    }

    getPostById(id) {
        return this.#postsById.get(String(id)) ?? null;
    }

    // Returns the next (chronologically newer) post, or null if none.
    getNextPost(id) {
        const idx = this.#postIndexById.get(String(id));
        if (idx === undefined) return null;
        if (idx <= 0) return null;
        return this.getPostById(this.#postOrder[idx - 1]);
    }

    // Returns the previous (chronologically older) post, or null if none.
    getPrevPost(id) {
        const idx = this.#postIndexById.get(String(id));
        if (idx === undefined) return null;
        if (idx >= this.#postOrder.length - 1) return null;
        return this.getPostById(this.#postOrder[idx + 1]);
    }

    getSearchStubs(numEntries = 1000) {
        return this.#posts.slice(0, numEntries);
    }
}
