# Accounting Journal Visibility Diagnosis

## Symptom

After a new pull, the journal entries page shows `0` rows even though accounting data is expected to exist.

This should be treated as a read-path or environment diagnosis first, not as evidence that journals were deleted.

## Production-Safe Diagnosis Flow

Run:

```bash
php artisan accounting:diagnose-journal-visibility
```

The command checks:

- app environment
- default DB connection
- configured and connected database name
- required accounting table presence
- raw counts for:
  - `journal_entries`
  - `journal_lines`
  - `accounting_event_queues`
  - `accounting_posting_logs`
- `JournalEntry` model count versus raw `journal_entries` table count
- recent sample journal rows
- route presence for `accounting.journals.index`

## How to Read the Result

### Case 1: raw table count is zero

Most likely causes:

- production is connected to the wrong database
- production database is empty
- schema/data was never present on that environment

### Case 2: raw table count is non-zero, model count is zero

Most likely causes:

- model connection mismatch
- global scope or bootstrapping issue
- production-only tenancy/bootstrap problem

### Case 3: raw table count and model count are both non-zero

Most likely causes:

- stale config cache
- stale deployed code
- page-level runtime/filter behavior
- PHP-FPM or worker processes not reloaded after deploy

## Follow-up Commands

After the diagnosis command, run:

```bash
php artisan migrate:status
php artisan deploy:verify-production-migrations
php artisan accounting:verify-module
php artisan optimize:clear
```

Then reload PHP-FPM / workers / application processes according to the production stack.

## Important Safety Rule

Do **not** use `php artisan migrate:fresh` or rebuild the production database just because the journal UI shows zero.

Only consider destructive repair if the diagnosis proves the production database is wrong, empty, or badly corrupted and a targeted repair is not possible.
