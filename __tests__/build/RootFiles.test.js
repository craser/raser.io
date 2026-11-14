// ABOUTME: Checks that no file in the project root is a symlink, because Next.js 13.4 builds those as pages.
// ABOUTME: A symlinked .env.local fails `next build` and prints the env file's contents in the error.

import fs from 'fs';
import path from 'path';

describe('project root files', () => {
    it('are not symlinks to files (Next.js 13.4 builds root-level file symlinks as pages)', () => {
        const rootDir = process.cwd();
        const symlinkedFiles = fs.readdirSync(rootDir, { withFileTypes: true })
            .filter((entry) => entry.isSymbolicLink())
            .filter((entry) => !fs.statSync(path.join(rootDir, entry.name)).isDirectory())
            .map((entry) => entry.name);

        expect(symlinkedFiles).toEqual([]);
    });
});
