#!/usr/bin/env python3
# ABOUTME: One-time migration script: exports raserio MySQL data to JSON files.
# ABOUTME: Reads database/raserio.sql, writes camelCase JSON to data/*.json.

import json
import os
import subprocess
import time

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SQL_FILE = os.path.join(PROJECT_ROOT, 'database', 'raserio.sql')
OUTPUT_DIR = os.path.join(PROJECT_ROOT, 'data')
DB_NAME = 'raserio_export_tmp'


def snake_to_camel(name):
    parts = name.split('_')
    return parts[0] + ''.join(p.title() for p in parts[1:])


def strip_blobs(sql_path):
    """Return path to a copy of the SQL with attachment_bytes INSERT data removed."""
    out = '/tmp/raserio_noblobs.sql'
    in_blob = False
    with open(sql_path, 'r', encoding='utf-8', errors='replace') as fin, \
         open(out, 'w', encoding='utf-8') as fout:
        for line in fin:
            if 'LOCK TABLES `attachment_bytes` WRITE' in line:
                in_blob = True
                fout.write(line)
                continue
            if in_blob:
                if 'UNLOCK TABLES' in line:
                    in_blob = False
                    fout.write(line)
                continue
            fout.write(line)
    return out


def mysql_cmd(args, stdin_path=None):
    cmd = ['mysql', '-u', 'root'] + args
    if stdin_path:
        with open(stdin_path, 'rb') as f:
            result = subprocess.run(cmd, stdin=f, capture_output=True)
    else:
        result = subprocess.run(cmd, capture_output=True)
    if result.returncode != 0:
        raise RuntimeError(result.stderr.decode())
    return result.stdout.decode()


def get_columns(db, table):
    """Return column names for the given table as a list."""
    out = mysql_cmd(['--batch', '--skip-column-names', db, '-e',
                     f'SHOW COLUMNS FROM `{table}`'])
    return [line.split('\t')[0] for line in out.strip().split('\n') if line]


def fetch_json(db, table, columns):
    """Fetch all rows as JSON using MySQL's JSON_ARRAYAGG — handles all escaping correctly."""
    pairs = ', '.join(f"'{snake_to_camel(c)}', `{c}`" for c in columns)
    query = f'SELECT JSON_ARRAYAGG(JSON_OBJECT({pairs})) FROM `{table}`'
    out = mysql_cmd(['--batch', '--raw', '--skip-column-names', db, '-e', query])
    out = out.strip()
    if not out or out == 'NULL':
        return []
    return json.loads(out)


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print('Starting MySQL...')
    subprocess.run(['brew', 'services', 'start', 'mysql'], check=True)
    time.sleep(3)  # give MySQL time to finish starting up

    stripped = None
    try:
        stripped = strip_blobs(SQL_FILE)
        print(f'Blob data stripped → {stripped}')

        mysql_cmd(['-e', f'DROP DATABASE IF EXISTS `{DB_NAME}`'])
        mysql_cmd(['-e', f'CREATE DATABASE `{DB_NAME}`'])
        print(f'Created database {DB_NAME}')

        mysql_cmd([DB_NAME], stdin_path=stripped)
        print('SQL imported')

        # Export blog_entries with attachments nested by entryId
        print('Fetching blog_entries...')
        entries = fetch_json(DB_NAME, 'blog_entries', get_columns(DB_NAME, 'blog_entries'))

        print('Fetching attachments...')
        # Attachments are nested into posts.json by entryId, not exported as a standalone file
        attachments = fetch_json(DB_NAME, 'attachments', get_columns(DB_NAME, 'attachments'))

        att_by_entry = {}
        for att in attachments:
            att_by_entry.setdefault(att['entryId'], []).append(att)
        for entry in entries:
            entry['attachments'] = att_by_entry.get(entry['entryId'], [])

        posts_path = os.path.join(OUTPUT_DIR, 'posts.json')
        with open(posts_path, 'w', encoding='utf-8') as f:
            json.dump(entries, f, ensure_ascii=False)
        print(f'Exported {len(entries)} entries → {posts_path}')

        # Export remaining tables (attachments are handled above, nested in posts.json)
        for table in ('comments', 'tags', 'links'):
            rows = fetch_json(DB_NAME, table, get_columns(DB_NAME, table))
            out_path = os.path.join(OUTPUT_DIR, f'{table}.json')
            with open(out_path, 'w', encoding='utf-8') as f:
                json.dump(rows, f, ensure_ascii=False)
            print(f'Exported {len(rows)} rows → {out_path}')

    finally:
        if stripped and os.path.exists(stripped):
            os.unlink(stripped)
        mysql_cmd(['-e', f'DROP DATABASE IF EXISTS `{DB_NAME}`'])
        result = subprocess.run(['brew', 'services', 'stop', 'mysql'], capture_output=True)
        if result.returncode != 0:
            print(f'Warning: brew services stop mysql failed: {result.stderr.decode().strip()}')
        print('Done.')


if __name__ == '__main__':
    main()
