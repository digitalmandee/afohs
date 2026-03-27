# Production Journal Restore Runbook

## Use Case

Use this runbook when production shows `0` journal entries after a pull and you want to recover by restoring from a **known-good production backup**.

This is a controlled restore flow.

Do not use:

- local database dumps
- staging database dumps
- `php artisan migrate:fresh`

## Preconditions

- production writes can be paused
- a known-good production backup exists
- you can take a fresh emergency backup of the current state before restoring

## Step 1. Freeze writes

Put production into maintenance mode or otherwise stop application writes:

```bash
php artisan down
```

## Step 2. Capture the current broken state

Create an emergency backup of the current production database:

```bash
DB_HOST=... DB_PORT=... DB_NAME=... DB_USER=... DB_PASSWORD=... \
DUMP_PATH=database/dumps/current-production-emergency-$(date +%Y%m%d-%H%M%S).sql.gz \
./scripts/backup-db.sh
```

Then capture the current app/database diagnosis:

```bash
php artisan accounting:diagnose-journal-visibility
php artisan migrate:status
php artisan deploy:verify-production-migrations
php artisan accounting:verify-module
```

## Step 3. Validate the restore source

Choose the most recent production backup that is known-good for:

- `journal_entries`
- `journal_lines`
- `accounting_event_queues`
- `accounting_posting_logs`
- `migrations`

## Step 4. Restore the known-good production backup

Restore the selected dump into the production database:

```bash
DB_HOST=... DB_PORT=... DB_NAME=... DB_USER=... DB_PASSWORD=... \
DUMP_PATH=/path/to/known-good-production-backup.sql.gz \
CONFIRM_RESTORE=YES_RESTORE \
./scripts/restore-db.sh
```

## Step 5. Bring schema forward normally

After the restore:

```bash
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan deploy:verify-production-migrations
php artisan accounting:verify-module
php artisan accounting:diagnose-journal-visibility
php artisan optimize:clear
```

Then reload PHP-FPM / queue workers / application processes according to the production stack.

## Step 6. Verify the recovery

Confirm:

- raw counts for `journal_entries`, `journal_lines`, `accounting_event_queues`, `accounting_posting_logs`
- `deploy:verify-production-migrations` passes
- `accounting:diagnose-journal-visibility` reports non-zero raw and model counts
- the journal list page no longer shows `0`

## Step 7. Reopen production

When verification is complete:

```bash
php artisan up
```

## Safety Rules

- Always take an emergency backup before restore.
- Restore only from a production backup, not from local or staging.
- Run normal forward migrations after restore.
- Never use `migrate:fresh` for this issue.
