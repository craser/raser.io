/**
 * ABOUTME: Tests for the blog-post command line helpers: arguments, the op run relaunch, yes/no answers.
 * ABOUTME: Pure functions; the entry script that uses them only wires them together.
 *
 * @jest-environment node
 */

import { parseArgs, relaunchDecision, relaunchCommand, isYes, REQUIRED_ENV, RELAUNCH_MARKER } from '@/lib/publish/cli';

describe('parseArgs', () => {
    test('--gen takes a folder name', () => {
        expect(parseArgs(['--gen', 'my-trip'])).toEqual({ command: 'gen', name: 'my-trip' });
    });

    test('a folder alone publishes with every flag off', () => {
        expect(parseArgs(['posts/my-trip'])).toEqual({ command: 'publish', dir: 'posts/my-trip', dryRun: false, force: false, yes: false });
    });

    test('flags may come before or after the folder', () => {
        expect(parseArgs(['--dry-run', 'posts/x', '--force', '--yes'])).toEqual({ command: 'publish', dir: 'posts/x', dryRun: true, force: true, yes: true });
    });

    test('--help asks for usage without an error', () => {
        expect(parseArgs(['--help'])).toEqual({ command: 'usage' });
    });

    test.each([
        [[]],
        [['posts/a', 'posts/b']],
        [['--gen']],
        [['--gen', '--dry-run']],
        [['--gen', 'x', 'posts/y']],
        [['--gen', 'x', '--force']],
        [['--bogus', 'posts/x']]
    ])('%p is a usage error', (argv) => {
        const result = parseArgs(argv);

        expect(result.command).toBe('usage');
        expect(result.error).toEqual(expect.any(String));
    });

    test('an unknown option is named in the error', () => {
        expect(parseArgs(['--bogus', 'posts/x']).error).toContain('--bogus');
    });
});

describe('relaunchDecision', () => {
    const complete = Object.fromEntries(REQUIRED_ENV.map(name => [name, 'value']));

    test('runs when every variable is set', () => {
        expect(relaunchDecision(complete)).toEqual({ action: 'run' });
    });

    test('relaunches under op run when variables are missing', () => {
        expect(relaunchDecision({})).toEqual({ action: 'relaunch' });
    });

    test('treats an empty value as missing', () => {
        expect(relaunchDecision({ ...complete, PUBLISH_BUNNY_ACCESS_KEY: '' })).toEqual({ action: 'relaunch' });
    });

    test('fails instead of relaunching twice, naming what op run did not supply', () => {
        const env = { ...complete, PUBLISH_DATABASE_URL: '', [RELAUNCH_MARKER]: '1' };

        expect(relaunchDecision(env)).toEqual({ action: 'fail', missing: ['PUBLISH_DATABASE_URL'] });
    });
});

describe('relaunchCommand', () => {
    test('re-runs this script with the same node flags and arguments under op run', () => {
        expect(relaunchCommand({
            envFile: '/repo/scripts/publish/publish.env',
            nodePath: '/usr/local/bin/node',
            execArgv: ['--enable-source-maps'],
            scriptPath: '/repo/bin/blog-post.mjs',
            argv: ['posts/x', '--dry-run']
        })).toEqual({
            command: 'op',
            args: [
                'run', '--env-file=/repo/scripts/publish/publish.env', '--',
                '/usr/local/bin/node', '--enable-source-maps',
                '/repo/bin/blog-post.mjs', 'posts/x', '--dry-run'
            ]
        });
    });
});

describe('isYes', () => {
    test.each(['y', 'Y', 'yes', 'YES', ' yes '])('%p is yes', (answer) => {
        expect(isYes(answer)).toBe(true);
    });

    test.each(['', 'n', 'no', 'yep', 'y es'])('%p is not yes', (answer) => {
        expect(isYes(answer)).toBe(false);
    });
});
