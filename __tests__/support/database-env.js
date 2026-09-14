// ABOUTME: Loads DATABASE_URL from .env.local for tests that talk to the real database.
// ABOUTME: Next.js skips .env.local when NODE_ENV is "test", so the tests read it themselves.

import fs from 'fs';
import path from 'path';

/**
 * Reads .env.local and copies any variable that isn't already set into process.env.
 * Quietly does nothing when the file is absent, so CI can supply the variables directly.
 */
export function loadDatabaseEnv() {
    const envPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) {
        return;
    }
    fs.readFileSync(envPath, 'utf-8')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'))
        .forEach(line => {
            const separator = line.indexOf('=');
            if (separator < 1) {
                return;
            }
            const name = line.slice(0, separator).trim();
            const value = line.slice(separator + 1).trim().replace(/^["']|["']$/g, '');
            if (!(name in process.env)) {
                process.env[name] = value;
            }
        });
}
