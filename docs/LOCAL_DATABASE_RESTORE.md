# Local Database Restore Guide

This project uses a local MySQL database, so `git pull` only updates code, migrations, seeders, and the committed SQL dump artifact. It does **not** update the running MySQL data automatically.

## Source of Truth For This Handoff

- Committed database dump: [database/dumps/afohs-club.sql.gz](/Users/sannanmalik/Downloads/Afohs-club-main/database/dumps/afohs-club.sql.gz)
- App database name expected by `.env`: `afohs-club`

## Restore Steps

1. Pull the latest repo changes.
2. Option A: use the helper script:

```bash
bash scripts/import-local-db.sh
```

3. Option B: run the commands manually if you want explicit control.
4. Create the target database if it does not already exist:

```bash
mysql -u root -h 127.0.0.1 -P 3306 --protocol=TCP -e "CREATE DATABASE IF NOT EXISTS \`afohs-club\`;"
```

5. Import the committed SQL dump:

```bash
gzip -dc database/dumps/afohs-club.sql.gz | mysql -u root -h 127.0.0.1 -P 3306 --protocol=TCP afohs-club
```

6. Make sure `.env` points to the restored database:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=afohs-club
DB_USERNAME=root
DB_PASSWORD=
```

7. Clear Laravel caches after import:

```bash
php artisan optimize:clear
php artisan permission:cache-reset
```

## Important Notes

- Do **not** run seeders after importing this dump unless you intentionally want to add bootstrap data on top of the imported database.
- The committed `.sql.gz` dump contains both schema and data for the local handoff.
- A larger uncompressed `.sql` file may exist locally for convenience, but it is intentionally not meant to be pushed to GitHub.
- `.env` is still local-only and is not committed to git.
- To refresh the dump from your current local MySQL data in the future, run:

```bash
bash scripts/export-local-db.sh
```

## Quick Verification

After import, verify:

1. The app opens without database errors.
2. Admin pages show expected operational data.
3. Accounting / COA data is visible.
4. Kitchen / printer / settings data is visible if expected for this environment.
5. If data is still missing, confirm the app is connected to the same MySQL database that received the import.
