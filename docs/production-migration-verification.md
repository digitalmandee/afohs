# Production Migration Verification

## Summary

For the current accounting backfill and procurement schema changes, production should use a standard non-destructive deployment flow:

1. take a database backup or snapshot
2. pull code
3. run `composer install --no-dev --optimize-autoloader`
4. run `php artisan migrate --force`
5. run `php artisan deploy:verify-production-migrations`
6. run `php artisan optimize:clear`
7. optionally run `php artisan accounting:verify-module`

Do not use `php artisan migrate:fresh` on production as part of this rollout.

## Migrations Covered

- `2026_03_26_150000_make_purchase_order_item_product_id_nullable`
- `2026_03_26_220000_create_accounting_backfill_runs_table`
- `2026_03_26_220100_create_accounting_backfill_records_table`

## Expected Schema Results

- `accounting_backfill_runs` exists
- `accounting_backfill_records` exists
- `purchase_order_items.product_id` exists and is nullable

## Verification Command

Run:

```bash
php artisan deploy:verify-production-migrations
```

The command checks:

- the three migration records are present in the `migrations` table
- the two backfill tables exist
- `purchase_order_items.product_id` is nullable

## When Not to Rebuild the Database

Do not dump and recreate production just to apply these changes.

Only consider a destructive rebuild path if production has already been proven to have severe schema drift, a corrupted migration repository, or a half-applied migration state that cannot be repaired safely.

In that case:

1. restore a backup into staging
2. repair the schema there
3. produce a targeted fix
4. apply the targeted fix to production

## Notes

- The nullable column migration uses `->change()`, so production should install dependencies from the checked-in `composer.lock`.
- Local verification already shows these migrations as applied successfully.
