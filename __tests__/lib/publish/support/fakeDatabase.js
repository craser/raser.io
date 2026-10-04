// ABOUTME: In-memory stand-in for a pg Pool, answering the statements PostWriter issues.
// ABOUTME: Records every statement so tests can check what was sent, and can inject failures.

export function fakeDatabase({
    maxEntryId = 3420,
    maxAttachmentId = 2929,
    maxTagId = 40,
    tags = {},
    entries = {},
    failures = []
} = {}) {
    const statements = [];
    const pending = [...failures];
    let releases = 0;

    async function query(sql, params = []) {
        const text = sql.replace(/\s+/g, ' ').trim();
        statements.push({ sql: text, params });

        const failure = pending.findIndex(f => f.match.test(text));
        if (failure >= 0) {
            throw pending.splice(failure, 1)[0].error;
        }
        if (text.startsWith('SELECT COALESCE(MAX(entry_id), 0) + 1')) {
            return { rows: [{ next_id: String(maxEntryId + 1) }], rowCount: 1 };
        }
        if (text.includes('MAX(attachment_id)')) {
            return { rows: [{ max_id: String(maxAttachmentId) }], rowCount: 1 };
        }
        if (text.includes('MAX(tag_id)')) {
            return { rows: [{ max_id: String(maxTagId) }], rowCount: 1 };
        }
        if (text.startsWith('SELECT tag_id, name FROM tags')) {
            const rows = params[0].filter(name => name in tags).map(name => ({ tag_id: tags[name], name }));
            return { rows, rowCount: rows.length };
        }
        if (text.startsWith('SELECT entry_id FROM blog_entries')) {
            const rows = params[0] in entries ? [{ entry_id: params[0] }] : [];
            return { rows, rowCount: rows.length };
        }
        if (text.startsWith('SELECT file_name FROM attachments')) {
            const rows = (entries[params[0]] ?? []).map(file_name => ({ file_name }));
            return { rows, rowCount: rows.length };
        }
        if (text.startsWith('UPDATE blog_entries')) {
            return { rows: [], rowCount: params[0] in entries ? 1 : 0 };
        }
        return { rows: [], rowCount: 1 };
    }

    const pool = {
        query,
        connect: async () => ({ query, release: () => { releases += 1; } })
    };

    return {
        pool,
        statements,
        sql: () => statements.map(s => s.sql),
        releases: () => releases
    };
}
