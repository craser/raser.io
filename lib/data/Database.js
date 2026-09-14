// ABOUTME: Generic shim around the PostgreSQL client library used to reach the blog database.
// ABOUTME: Owns one lazily-created connection pool; reach it via Database.getInstance().

import { Pool } from 'pg';

/**
 * The connection pool is parked on globalThis so that the module reloading Next.js
 * does in development reuses one pool instead of opening a fresh one per edit.
 */
const POOL_KEY = Symbol.for('raser.io.database.pool');

export default class Database {
    static #instance = null;

    static getInstance() {
        if (!Database.#instance) {
            Database.#instance = new Database();
        }
        return Database.#instance;
    }

    #getPool() {
        if (!globalThis[POOL_KEY]) {
            const connectionString = process.env.DATABASE_URL;
            if (!connectionString) {
                throw new Error('DATABASE_URL is not configured');
            }
            globalThis[POOL_KEY] = new Pool({ connectionString });
        }
        return globalThis[POOL_KEY];
    }

    /**
     * Runs a parameterized statement and hands back the rows.
     *
     * @param sql {string} statement with $1-style placeholders
     * @param params {Array} values for the placeholders
     * @returns {Promise<Array<Object>>}
     */
    async query(sql, params = []) {
        const result = await this.#getPool().query(sql, params);
        return result.rows;
    }

    /**
     * Releases the pool. Tests call this so the process can exit; the server never needs to.
     */
    async close() {
        const pool = globalThis[POOL_KEY];
        if (pool) {
            globalThis[POOL_KEY] = null;
            await pool.end();
        }
    }
}
