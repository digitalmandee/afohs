# Payroll: Dedupe & Migration Instructions

This short README explains how to safely deduplicate `payslip_deductions.order_id`, run the provided backfill/dedupe migration, and apply the unique-index migration that enforces one payslip-deduction per order.

Follow these steps on your development or staging environment first. Always BACKUP your database before mutating production data.

## Prerequisites

- PHP CLI and Composer installed
- Laravel project's dependencies installed
- `php artisan` available and configured to connect to your database
- A recent backup of your database (use `mysqldump` or your preferred backup tool)

## Recommended workflow (safe)

1. Make a database backup

    PowerShell example (MySQL):

```powershell
mysqldump -u DB_USER -pDB_PASSWORD DB_NAME > backup_before_dedupe.sql
```

2. Inspect duplicate `order_id` values (dry-run)

    The repo includes an artisan command that reports duplicate `order_id` values in `payslip_deductions`:

```powershell
php artisan payslip:dedupe-orderids
```

This will list any `order_id` values that appear more than once. If none are reported, you can proceed to run migrations.

3. (Optional) Apply de-duplication using the artisan command

    If duplicates are reported and you are happy to nullify the duplicate rows (keeping the earliest row per `order_id`), run:

```powershell
php artisan payslip:dedupe-orderids --apply
```

- This will set `order_id = NULL` for all but the earliest `payslip_deductions` row for each duplicated `order_id`.
- This action is destructive (the nullified values cannot be restored by the script). Keep the DB backup.

4. Apply migrations

    The repository contains migrations to add `order_id` to `payslip_deductions`, `deducted_in_payslip_id` and `deducted_at` to `orders`, plus a migration to add a unique index on `payslip_deductions.order_id`.

    Run Laravel migrations:

```powershell
composer dump-autoload
php artisan migrate
```

If you prefer to run a single migration file (the dedupe migration) you can run it by path:

```powershell
php artisan migrate --path=database/migrations/2025_11_19_000005_dedupe_payslip_deductions_order_id.php
```

After the dedupe migration/command has been applied and duplicates resolved, run migrations to add the unique index migration (if present):

```powershell
php artisan migrate --path=database/migrations/2025_11_19_000004_add_unique_index_to_payslip_deductions_order_id.php
```

5. Clear caches and regenerate autoload (optional but recommended)

```powershell
composer dump-autoload
php artisan config:clear; php artisan cache:clear; php artisan route:clear
```

6. Verify results

Run this SQL to ensure there are no duplicate non-null `order_id` values:

```sql
SELECT order_id, COUNT(*) AS cnt
FROM payslip_deductions
WHERE order_id IS NOT NULL
GROUP BY order_id
HAVING cnt > 1;
```

If this returns no rows, it's safe to add the unique index (the migration should already do that).

## Notes & Safety

- The dedupe migration and the `--apply` command keep the earliest row (lowest `id`) for each duplicated `order_id` and NULL out the rest.
- Nullifying duplicates is irreversible via the migration/command — rely on your DB backup to restore original values if needed.
- Consider reviewing duplicates manually before applying the `--apply` option. You might want to merge or reassign duplicates instead of nullifying them.

## Kernel registration (if artisan command not found)

If your Laravel app does not auto-discover commands or you don't see `payslip:dedupe-orderids` listed in `php artisan list`, register the command in `app/Console/Kernel.php`:

```php
// app/Console/Kernel.php
protected $commands = [
    \App\Console\Commands\DedupePayslipDeductions::class,
];
```

Then run `php artisan` again to confirm the new command appears.

## Rollback

- The dedupe step cannot be rolled back by the migration/command. Restore your DB backup if you need to revert.
- To rollback migrations, use Laravel's migration rollback tooling:

```powershell
php artisan migrate:rollback
```

But note: rolling back schema/migrations will not restore nullified `order_id` values.

---

If you'd like, I can also:

- Add a small UI hint in the front-end to show which CTS orders were already deducted (I already added a dimmed style).
- Add a safety script to produce a CSV report of duplicates for manual review before applying changes.

Tell me which of the above you want next and I will implement it.
