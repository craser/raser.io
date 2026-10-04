// ABOUTME: Command line helpers for `npm run blog-post`: argument parsing (gen, publish, delete), the op run relaunch, yes/no answers.
// ABOUTME: Kept apart from scripts/blog-post.js so they can be unit tested.

import path from 'node:path';

export const REQUIRED_ENV = [
    'PUBLISH_DATABASE_URL',
    'PUBLISH_BUNNY_STORAGE_HOST',
    'PUBLISH_BUNNY_STORAGE_ZONE',
    'PUBLISH_BUNNY_ACCESS_KEY'
];

/** Set on the relaunched process, so a second missing-variable check fails instead of looping. */
export const RELAUNCH_MARKER = 'PUBLISH_RELAUNCHED';

export const USAGE = [
    'Usage:',
    '  npm run blog-post -- --gen <name>             create posts/<name>/ from the template',
    '  npm run blog-post -- <post-dir> [options]     publish a post folder to raser.io',
    '  npm run blog-post -- --delete <entry-id | post-dir> [--dry-run] [--yes] [--purge-files]',
    '                                                delete a post from raser.io',
    '',
    'Options:',
    '  --dry-run       show what would happen; change nothing',
    '  --force         overwrite same-named CDN files not recorded as this post\'s (publish only)',
    '  --yes           go ahead without asking for confirmation',
    '  --purge-files   also delete the post\'s files from the CDN, unless another post uses them (delete only)'
].join('\n');

const FLAGS = { '--dry-run': 'dryRun', '--force': 'force', '--yes': 'yes', '--purge-files': 'purgeFiles' };

/** An entry ID is written as plain digits; any other delete target is a post folder. */
const ENTRY_ID = /^\d+$/;

export function parseArgs(argv) {
    const flags = { dryRun: false, force: false, yes: false, purgeFiles: false };
    const positional = [];
    let gen = null;
    let deleteTarget = null;

    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        if (arg === '--gen' || arg === '--delete') {
            const value = argv[i + 1];
            i += 1;
            if (!value || value.startsWith('-')) {
                return usage(arg === '--gen' ? '--gen needs a folder name.' : '--delete needs an entry ID or a post folder.');
            }
            if (arg === '--gen') {
                gen = value;
            } else {
                deleteTarget = value;
            }
        } else if (Object.prototype.hasOwnProperty.call(FLAGS, arg)) {
            flags[FLAGS[arg]] = true;
        } else if (arg === '--help' || arg === '-h') {
            return { command: 'usage' };
        } else if (arg.startsWith('-')) {
            return usage(`Unknown option ${arg}.`);
        } else {
            positional.push(arg);
        }
    }

    if (gen !== null) {
        if (deleteTarget !== null || positional.length > 0 || Object.values(flags).some(Boolean)) {
            return usage('--gen takes only a folder name.');
        }
        return { command: 'gen', name: gen };
    }
    if (deleteTarget !== null) {
        if (positional.length > 0 || flags.force) {
            return usage('--delete takes one entry ID or post folder, with --dry-run, --yes or --purge-files.');
        }
        const target = ENTRY_ID.test(deleteTarget) ? { entryId: Number(deleteTarget) } : { dir: deleteTarget };
        return { command: 'delete', target, dryRun: flags.dryRun, yes: flags.yes, purgeFiles: flags.purgeFiles };
    }
    if (flags.purgeFiles) {
        return usage('--purge-files only applies to --delete.');
    }
    if (positional.length !== 1) {
        return usage('Give exactly one post folder.');
    }
    return { command: 'publish', dir: positional[0], dryRun: flags.dryRun, force: flags.force, yes: flags.yes };
}

/**
 * npm runs scripts from the repo root but records where it was invoked in INIT_CWD, which is
 * what a relative post folder means to the person typing it.
 */
export function resolvePostDir(dir, env, cwd) {
    return path.resolve(env.INIT_CWD ?? cwd, dir);
}

export function relaunchDecision(env) {
    const missing = REQUIRED_ENV.filter(name => !env[name]);
    if (missing.length === 0) {
        return { action: 'run' };
    }
    if (env[RELAUNCH_MARKER]) {
        return { action: 'fail', missing };
    }
    return { action: 'relaunch' };
}

export function relaunchCommand({ envFile, nodePath, execArgv, scriptPath, argv }) {
    return {
        command: 'op',
        args: ['run', `--env-file=${envFile}`, '--', nodePath, ...execArgv, scriptPath, ...argv]
    };
}

export function isYes(answer) {
    return /^y(es)?$/i.test(answer.trim());
}

function usage(error) {
    return { command: 'usage', error };
}
