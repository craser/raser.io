/**
 * ABOUTME: Tests for deciding which post files to upload, skip, or flag as CDN name collisions.
 * ABOUTME: Pure logic over the CDN listing; one test per row of the spec's classification table.
 *
 * @jest-environment node
 */

import { planUploads } from '@/lib/publish/PublishPlanner';

const file = (name, checksum = 'SAME') => ({ path: `images/${name}`, name, checksum });
const names = (files) => files.map(f => f.name);

function plan(files, listing, { owned = [], force = false } = {}) {
    return planUploads({ files, listing: new Map(Object.entries(listing)), ownedNames: new Set(owned), force });
}

test('a file not on the CDN is uploaded', () => {
    expect(names(plan([file('a.jpg')], {}).upload)).toEqual(['a.jpg']);
});

test('a file with the same checksum is skipped', () => {
    const result = plan([file('a.jpg')], { 'a.jpg': 'SAME' });

    expect(names(result.skip)).toEqual(['a.jpg']);
    expect(result.upload).toEqual([]);
});

test("a changed file that is one of this entry's attachments is uploaded", () => {
    const result = plan([file('a.jpg')], { 'a.jpg': 'OTHER' }, { owned: ['a.jpg'] });

    expect(names(result.upload)).toEqual(['a.jpg']);
    expect(result.collision).toEqual([]);
});

test("a different file with the same name as another post's is a collision", () => {
    const result = plan([file('a.jpg')], { 'a.jpg': 'OTHER' });

    expect(names(result.collision)).toEqual(['a.jpg']);
    expect(result.upload).toEqual([]);
});

test('a CDN file with no checksum counts as different', () => {
    expect(names(plan([file('a.jpg')], { 'a.jpg': null }).collision)).toEqual(['a.jpg']);
});

test('--force turns collisions into uploads and reports them as forced', () => {
    const result = plan([file('a.jpg')], { 'a.jpg': 'OTHER' }, { force: true });

    expect(names(result.upload)).toEqual(['a.jpg']);
    expect(names(result.forced)).toEqual(['a.jpg']);
    expect(result.collision).toEqual([]);
});

test('sorts a mix of files into their buckets', () => {
    const result = plan(
        [file('new.jpg'), file('same.jpg'), file('mine.jpg'), file('theirs.jpg')],
        { 'same.jpg': 'SAME', 'mine.jpg': 'OLD', 'theirs.jpg': 'OLD' },
        { owned: ['mine.jpg'] }
    );

    expect(names(result.upload)).toEqual(['new.jpg', 'mine.jpg']);
    expect(names(result.skip)).toEqual(['same.jpg']);
    expect(names(result.collision)).toEqual(['theirs.jpg']);
    expect(result.forced).toEqual([]);
});
