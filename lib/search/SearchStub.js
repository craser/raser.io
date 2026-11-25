// ABOUTME: Reduces a blog post to the compact stub the client-side search index is built from.
// ABOUTME: Runs on the server, so the browser downloads searchable words instead of whole posts.

import { extractTextFromStub, uniqueWords } from '@/lib/search/TextProcessing';
import { ENGLISH_STOP_WORDS } from '@/lib/search/SearchImplementation';

const STOP_WORDS = new Set(ENGLISH_STOP_WORDS);

/**
 * Returns the fields a search result shows, plus the post's searchable words: each word of
 * its title, intro and body once, in first-appearance order, without the stop words the
 * index ignores. The index built from it finds the same posts, in the same order, with the
 * same completions, as one built from the full post.
 */
export function toSearchStub(post) {
    const words = uniqueWords(extractTextFromStub(post))
        .split(' ')
        .filter(word => !STOP_WORDS.has(word));
    return {
        entryId: post.entryId,
        title: post.title,
        datePosted: post.datePosted,
        text: words.join(' '),
    };
}
