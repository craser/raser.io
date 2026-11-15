// ABOUTME: Checks that the project root has no Babel config file, so Next.js compiles with SWC.
// ABOUTME: A Babel config makes Turbopack trace the whole project into server functions; Jest's Babel settings live in jest.config.json.

import fs from 'fs';
import path from 'path';

// The Babel config file names Next.js looks for in the project root.
const BABEL_CONFIG_FILES = [
    '.babelrc',
    '.babelrc.json',
    '.babelrc.js',
    '.babelrc.cjs',
    '.babelrc.mjs',
    'babel.config.js',
    'babel.config.json',
    'babel.config.cjs',
    'babel.config.mjs',
];

describe('project root', () => {
    it('has no Babel config file, so Next.js compiles with SWC', () => {
        const rootDir = process.cwd();
        const present = BABEL_CONFIG_FILES.filter((name) => fs.existsSync(path.join(rootDir, name)));

        expect(present).toEqual([]);
    });
});
