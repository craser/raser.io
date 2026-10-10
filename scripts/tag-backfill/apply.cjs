// ABOUTME: One-off backfill of tags for entries 3253-3420, from draft.json, as one transaction.
// ABOUTME: Dry run by default; pass --apply to write. Skips any entry that already has tags.

const path = require('node:path');
const fs = require('node:fs');
const { Pool } = require(path.join(process.cwd(), 'node_modules', 'pg'));

const apply = process.argv.includes('--apply');
const draft = JSON.parse(fs.readFileSync(path.join(__dirname, 'draft.json'), 'utf-8'));
const connectionString = process.env.PUBLISH_DATABASE_URL || process.env.DATABASE_URL;

async function main() {
    const pool = new Pool({ connectionString });
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const ids = draft.map(d => d.entryId);
        const { rows: entries } = await client.query('SELECT entry_id, title FROM blog_entries WHERE entry_id = ANY($1)', [ids]);
        const titles = new Map(entries.map(r => [r.entry_id, r.title]));
        const { rows: tagged } = await client.query('SELECT DISTINCT object_id FROM tag_links WHERE object_id = ANY($1)', [ids]);
        const alreadyTagged = new Set(tagged.map(r => r.object_id));

        const todo = [];
        for (const d of draft) {
            if (!titles.has(d.entryId)) {
                console.log(`skip ${d.entryId}: no such entry`);
            } else if (titles.get(d.entryId) !== d.title) {
                console.log(`skip ${d.entryId}: title is "${titles.get(d.entryId)}", draft expected "${d.title}"`);
            } else if (alreadyTagged.has(d.entryId)) {
                console.log(`skip ${d.entryId}: already has tags`);
            } else {
                todo.push(d);
            }
        }

        const names = [...new Set(todo.flatMap(d => d.tags))];
        const { rows: tagRows } = await client.query('SELECT tag_id, name FROM tags WHERE name = ANY($1)', [names]);
        const tagIds = new Map(tagRows.map(r => [r.name, r.tag_id]));
        const missing = names.filter(n => !tagIds.has(n));
        if (missing.length > 0) {
            const { rows } = await client.query('SELECT COALESCE(MAX(tag_id), 0) AS max_id FROM tags');
            let tagId = Number(rows[0].max_id);
            for (const name of missing) {
                tagId += 1;
                await client.query('INSERT INTO tags (tag_id, name) VALUES ($1, $2)', [tagId, name]);
                tagIds.set(name, tagId);
            }
            console.log(`new tags: ${missing.join(', ')}`);
        }

        let links = 0;
        for (const d of todo) {
            for (const name of d.tags) {
                await client.query('INSERT INTO tag_links (object_id, tag_id) VALUES ($1, $2)', [d.entryId, tagIds.get(name)]);
                links += 1;
            }
        }
        console.log(`${todo.length} entries, ${links} tag links${apply ? '' : ' (dry run: rolling back)'}`);
        await client.query(apply ? 'COMMIT' : 'ROLLBACK');
    } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

main().catch(error => { console.error(error.message); process.exit(1); });
