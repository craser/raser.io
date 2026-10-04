// ABOUTME: Command line entry point for `npm run blog-post`: scaffolds post folders and publishes them.
// ABOUTME: Bundled into bin/blog-post.mjs by `npm run build:publish`; holds wiring only, the logic is in lib/publish.

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import CdnStore from '@/lib/publish/CdnStore';
import { isYes, parseArgs, relaunchCommand, relaunchDecision, RELAUNCH_MARKER, USAGE } from '@/lib/publish/cli';
import { createPostScaffold } from '@/lib/publish/PostScaffold';
import PostWriter from '@/lib/publish/PostWriter';
import PublishError from '@/lib/publish/PublishError';
import Publisher from '@/lib/publish/Publisher';

// After bundling this is bin/blog-post.mjs, the file to re-run under op run. bin/ and scripts/
// sit at the same depth, so the repo root is one level up either way.
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const ENV_FILE = path.join(REPO_ROOT, 'scripts', 'publish', 'publish.env');
const POSTS_ROOT = path.join(REPO_ROOT, 'posts');

async function confirm(question) {
    const prompt = readline.createInterface({ input: process.stdin, output: process.stdout });
    try {
        return isYes(await prompt.question(`${question} [y/N] `));
    } finally {
        prompt.close();
    }
}

function relaunch(argv) {
    const { command, args } = relaunchCommand({
        envFile: ENV_FILE,
        nodePath: process.execPath,
        execArgv: process.execArgv,
        scriptPath: SCRIPT_PATH,
        argv
    });
    const result = spawnSync(command, args, { stdio: 'inherit', env: { ...process.env, [RELAUNCH_MARKER]: '1' } });
    if (result.error?.code === 'ENOENT') {
        console.error('The 1Password CLI ("op") is not installed: https://developer.1password.com/docs/cli/get-started/');
        return 1;
    }
    return result.status ?? 1;
}

async function publish({ dir, dryRun, force, yes }) {
    const pool = new pg.Pool({ connectionString: process.env.PUBLISH_DATABASE_URL });
    try {
        const publisher = new Publisher({
            cdn: new CdnStore({
                host: process.env.PUBLISH_BUNNY_STORAGE_HOST,
                zone: process.env.PUBLISH_BUNNY_STORAGE_ZONE,
                accessKey: process.env.PUBLISH_BUNNY_ACCESS_KEY
            }),
            writer: new PostWriter({ pool }),
            confirm,
            log: line => console.log(line)
        });
        const result = await publisher.publish(path.resolve(dir), { dryRun, force, yes });
        if (result.status === 'published') {
            console.log(`Published entry ${result.entryId}. It can take up to an hour to appear on raser.io.`);
        } else if (result.status === 'cancelled') {
            console.log('Cancelled; nothing changed.');
        } else {
            console.log('Dry run; nothing changed.');
        }
        return 0;
    } finally {
        await pool.end();
    }
}

async function main(argv) {
    const args = parseArgs(argv);
    if (args.command === 'usage') {
        if (args.error) {
            console.error(args.error);
        }
        console.error(USAGE);
        return args.error ? 2 : 0;
    }
    if (args.command === 'gen') {
        const dir = createPostScaffold(POSTS_ROOT, args.name);
        console.log(`Created ${path.relative(process.cwd(), dir)}/`);
        return 0;
    }
    const decision = relaunchDecision(process.env);
    if (decision.action === 'relaunch') {
        return relaunch(argv);
    }
    if (decision.action === 'fail') {
        console.error(`1Password did not supply ${decision.missing.join(', ')}. Check ${path.relative(process.cwd(), ENV_FILE)} against the 1Password item.`);
        return 1;
    }
    return publish(args);
}

main(process.argv.slice(2))
    .then((code) => {
        process.exitCode = code;
    })
    .catch((error) => {
        if (error instanceof PublishError) {
            console.error(error.message);
            for (const detail of error.details) {
                console.error(`  - ${detail}`);
            }
        } else {
            console.error(error.stack ?? error);
        }
        process.exitCode = 1;
    });
