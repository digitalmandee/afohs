<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private function q(string $identifier): string
    {
        return '`'.str_replace('`', '``', $identifier).'`';
    }

    private function mysqlOnly(): bool
    {
        return DB::getDriverName() === 'mysql';
    }

    private function hasIndex(string $table, string $index): bool
    {
        $rows = DB::select(
            'SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1',
            [$table, $index]
        );

        return ! empty($rows);
    }

    private function hasForeignKeyConstraint(string $table, string $constraint): bool
    {
        $rows = DB::select(
            "SELECT 1
             FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = ?
               AND CONSTRAINT_NAME = ?
               AND CONSTRAINT_TYPE = 'FOREIGN KEY'
             LIMIT 1",
            [$table, $constraint]
        );

        return ! empty($rows);
    }

    private function dropForeignKeysOnTenantId(string $table): void
    {
        $constraints = DB::select(
            "SELECT CONSTRAINT_NAME AS name
             FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = ?
               AND COLUMN_NAME = 'tenant_id'
               AND REFERENCED_TABLE_NAME IS NOT NULL",
            [$table]
        );

        foreach ($constraints as $constraint) {
            DB::statement('ALTER TABLE '.$this->q($table).' DROP FOREIGN KEY '.$this->q($constraint->name));
        }
    }

    private function dropIndexesOnTenantId(string $table): void
    {
        $indexes = DB::select(
            "SELECT DISTINCT INDEX_NAME AS name
             FROM INFORMATION_SCHEMA.STATISTICS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = ?
               AND COLUMN_NAME = 'tenant_id'
               AND INDEX_NAME <> 'PRIMARY'",
            [$table]
        );

        foreach ($indexes as $index) {
            DB::statement('ALTER TABLE '.$this->q($table).' DROP INDEX '.$this->q($index->name));
        }
    }

    private function getColumnInfo(string $table, string $column): ?object
    {
        $columns = DB::select(
            'SELECT DATA_TYPE AS data_type, IS_NULLABLE AS is_nullable, EXTRA AS extra
             FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = ?
               AND COLUMN_NAME = ?
             LIMIT 1',
            [$table, $column]
        );

        return $columns[0] ?? null;
    }

    private function getTenantIdColumnInfo(string $table): ?object
    {
        return $this->getColumnInfo($table, 'tenant_id');
    }

    private function tablesWithTenantIdExceptTenants(): array
    {
        $rows = DB::select(
            "SELECT DISTINCT TABLE_NAME AS name
             FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND COLUMN_NAME = 'tenant_id'
               AND TABLE_NAME <> 'tenants'"
        );

        return array_map(fn ($r) => $r->name, $rows);
    }

    private function reAddTenantForeignKeysBigint(): void
    {
        $tables = ['domains', 'pos_sub_categories', 'pos_units', 'pos_manufacturers'];

        foreach ($tables as $table) {
            if (! Schema::hasTable($table) || ! Schema::hasColumn($table, 'tenant_id')) {
                continue;
            }

            $fkName = $table.'_tenant_id_foreign';

            if ($this->hasForeignKeyConstraint($table, $fkName)) {
                continue;
            }

            DB::statement(
                'ALTER TABLE '.$this->q($table)
                .' ADD CONSTRAINT '.$this->q($fkName)
                .' FOREIGN KEY ('.$this->q('tenant_id').') REFERENCES '.$this->q('tenants').' ('.$this->q('id').')'
                .' ON UPDATE CASCADE ON DELETE CASCADE'
            );
        }
    }

    private function reAddTenantForeignKeysString(): void
    {
        $tables = ['domains', 'pos_sub_categories', 'pos_units', 'pos_manufacturers'];

        foreach ($tables as $table) {
            if (! Schema::hasTable($table) || ! Schema::hasColumn($table, 'tenant_id')) {
                continue;
            }

            $fkName = $table.'_tenant_id_foreign';

            if ($this->hasForeignKeyConstraint($table, $fkName)) {
                continue;
            }

            DB::statement(
                'ALTER TABLE '.$this->q($table)
                .' ADD CONSTRAINT '.$this->q($fkName)
                .' FOREIGN KEY ('.$this->q('tenant_id').') REFERENCES '.$this->q('tenants').' ('.$this->q('id').')'
                .' ON UPDATE CASCADE ON DELETE CASCADE'
            );
        }
    }

    public function up(): void
    {
        if (! $this->mysqlOnly()) {
            return;
        }

        if (! Schema::hasTable('tenants')) {
            return;
        }

        $tenantsIdInfo = $this->getColumnInfo('tenants', 'id');
        $tenantsIdType = strtolower((string) ($tenantsIdInfo->data_type ?? ''));
        $tenantsIdIsNumeric = in_array($tenantsIdType, ['bigint', 'int'], true);

        if ($tenantsIdIsNumeric) {
            $tables = $this->tablesWithTenantIdExceptTenants();

            foreach ($tables as $table) {
                $info = $this->getTenantIdColumnInfo($table);
                if (! $info) {
                    continue;
                }

                if (in_array(strtolower((string) $info->data_type), ['bigint', 'int'], true)) {
                    continue;
                }

                $nullableSql = strtoupper((string) $info->is_nullable) === 'YES' ? 'NULL' : 'NOT NULL';

                $this->dropForeignKeysOnTenantId($table);
                $this->dropIndexesOnTenantId($table);

                if (Schema::hasColumn($table, 'tenant_id_int')) {
                    DB::statement('ALTER TABLE '.$this->q($table).' DROP COLUMN '.$this->q('tenant_id_int'));
                }

                DB::statement(
                    'ALTER TABLE '.$this->q($table)
                    .' ADD COLUMN '.$this->q('tenant_id_int').' BIGINT UNSIGNED '.$nullableSql
                );

                DB::statement(
                    'UPDATE '.$this->q($table).' t'
                    .' SET t.'.$this->q('tenant_id_int').' = CAST(t.'.$this->q('tenant_id').' AS UNSIGNED)'
                    .' WHERE t.'.$this->q('tenant_id').' IS NOT NULL'
                );

                DB::statement('ALTER TABLE '.$this->q($table).' DROP COLUMN '.$this->q('tenant_id'));
                DB::statement(
                    'ALTER TABLE '.$this->q($table)
                    .' CHANGE COLUMN '.$this->q('tenant_id_int').' '.$this->q('tenant_id').' BIGINT UNSIGNED '.$nullableSql
                );

                if ($table === 'user_tenant_access') {
                    if (! $this->hasIndex($table, 'user_tenant_access_user_id_tenant_id_unique')) {
                        DB::statement(
                            'ALTER TABLE '.$this->q($table)
                            .' ADD UNIQUE KEY '.$this->q('user_tenant_access_user_id_tenant_id_unique')
                            .' ('.$this->q('user_id').', '.$this->q('tenant_id').')'
                        );
                    }

                    if (! $this->hasIndex($table, 'user_tenant_access_tenant_id_index')) {
                        DB::statement(
                            'ALTER TABLE '.$this->q($table)
                            .' ADD INDEX '.$this->q('user_tenant_access_tenant_id_index')
                            .' ('.$this->q('tenant_id').')'
                        );
                    }

                    continue;
                }

                $indexName = $table.'_tenant_id_index';
                if (! $this->hasIndex($table, $indexName)) {
                    DB::statement(
                        'ALTER TABLE '.$this->q($table)
                        .' ADD INDEX '.$this->q($indexName)
                        .' ('.$this->q('tenant_id').')'
                    );
                }
            }

            $this->dropForeignKeysOnTenantId('domains');
            $this->dropForeignKeysOnTenantId('pos_sub_categories');
            $this->dropForeignKeysOnTenantId('pos_units');
            $this->dropForeignKeysOnTenantId('pos_manufacturers');

            $this->reAddTenantForeignKeysBigint();

            if (Schema::hasColumn('tenants', 'old_id')) {
                DB::statement('ALTER TABLE '.$this->q('tenants').' DROP COLUMN '.$this->q('old_id'));
            }

            if (Schema::hasColumn('tenants', 'new_id')) {
                DB::statement('ALTER TABLE '.$this->q('tenants').' DROP COLUMN '.$this->q('new_id'));
            }

            return;
        }

        if (! Schema::hasColumn('tenants', 'old_id')) {
            Schema::table('tenants', function ($table) {
                $table->string('old_id')->nullable();
            });
        }

        DB::statement('UPDATE '.$this->q('tenants').' SET '.$this->q('old_id').' = '.$this->q('id').' WHERE '.$this->q('old_id').' IS NULL');

        if (! Schema::hasColumn('tenants', 'new_id')) {
            DB::statement(
                'ALTER TABLE '.$this->q('tenants')
                .' ADD COLUMN '.$this->q('new_id').' BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,'
                .' ADD UNIQUE KEY '.$this->q('tenants_new_id_unique').' ('.$this->q('new_id').')'
            );
        }

        $tables = $this->tablesWithTenantIdExceptTenants();

        foreach ($tables as $table) {
            $info = $this->getTenantIdColumnInfo($table);
            if (! $info) {
                continue;
            }

            if (in_array(strtolower((string) $info->data_type), ['bigint', 'int'], true)) {
                continue;
            }

            $nullableSql = strtoupper((string) $info->is_nullable) === 'YES' ? 'NULL' : 'NOT NULL';

            $this->dropForeignKeysOnTenantId($table);
            $this->dropIndexesOnTenantId($table);

            if (Schema::hasColumn($table, 'tenant_id_int')) {
                DB::statement('ALTER TABLE '.$this->q($table).' DROP COLUMN '.$this->q('tenant_id_int'));
            }

            DB::statement(
                'ALTER TABLE '.$this->q($table)
                .' ADD COLUMN '.$this->q('tenant_id_int').' BIGINT UNSIGNED '.$nullableSql
            );

            DB::statement(
                'UPDATE '.$this->q($table).' t'
                .' JOIN '.$this->q('tenants').' ten ON ten.'.$this->q('old_id').' = t.'.$this->q('tenant_id')
                .' SET t.'.$this->q('tenant_id_int').' = ten.'.$this->q('new_id')
                .' WHERE t.'.$this->q('tenant_id').' IS NOT NULL'
            );

            DB::statement('ALTER TABLE '.$this->q($table).' DROP COLUMN '.$this->q('tenant_id'));
            DB::statement(
                'ALTER TABLE '.$this->q($table)
                .' CHANGE COLUMN '.$this->q('tenant_id_int').' '.$this->q('tenant_id').' BIGINT UNSIGNED '.$nullableSql
            );

            if ($table === 'user_tenant_access') {
                if (! $this->hasIndex($table, 'user_tenant_access_user_id_tenant_id_unique')) {
                    DB::statement(
                        'ALTER TABLE '.$this->q($table)
                        .' ADD UNIQUE KEY '.$this->q('user_tenant_access_user_id_tenant_id_unique')
                        .' ('.$this->q('user_id').', '.$this->q('tenant_id').')'
                    );
                }

                if (! $this->hasIndex($table, 'user_tenant_access_tenant_id_index')) {
                    DB::statement(
                        'ALTER TABLE '.$this->q($table)
                        .' ADD INDEX '.$this->q('user_tenant_access_tenant_id_index')
                        .' ('.$this->q('tenant_id').')'
                    );
                }

                continue;
            }

            $indexName = $table.'_tenant_id_index';
            if (! $this->hasIndex($table, $indexName)) {
                DB::statement(
                    'ALTER TABLE '.$this->q($table)
                    .' ADD INDEX '.$this->q($indexName)
                    .' ('.$this->q('tenant_id').')'
                );
            }
        }

        $this->dropForeignKeysOnTenantId('domains');
        $this->dropForeignKeysOnTenantId('pos_sub_categories');
        $this->dropForeignKeysOnTenantId('pos_units');
        $this->dropForeignKeysOnTenantId('pos_manufacturers');

        DB::statement('ALTER TABLE '.$this->q('tenants').' DROP PRIMARY KEY');
        DB::statement('ALTER TABLE '.$this->q('tenants').' DROP COLUMN '.$this->q('id'));
        $dropNewIdUniqueSql = $this->hasIndex('tenants', 'tenants_new_id_unique')
            ? ', DROP INDEX '.$this->q('tenants_new_id_unique')
            : '';

        DB::statement(
            'ALTER TABLE '.$this->q('tenants')
            .' CHANGE COLUMN '.$this->q('new_id').' '.$this->q('id').' BIGINT UNSIGNED NOT NULL'
            .$dropNewIdUniqueSql
            .', ADD PRIMARY KEY ('.$this->q('id').')'
        );
        DB::statement(
            'ALTER TABLE '.$this->q('tenants')
            .' MODIFY COLUMN '.$this->q('id').' BIGINT UNSIGNED NOT NULL AUTO_INCREMENT'
        );

        $this->reAddTenantForeignKeysBigint();

        if (Schema::hasColumn('tenants', 'old_id')) {
            DB::statement('ALTER TABLE '.$this->q('tenants').' DROP COLUMN '.$this->q('old_id'));
        }
    }

    public function down(): void
    {
        if (! $this->mysqlOnly()) {
            return;
        }

        if (! Schema::hasTable('tenants')) {
            return;
        }

        if (! Schema::hasColumn('tenants', 'id_str')) {
            Schema::table('tenants', function ($table) {
                $table->string('id_str')->nullable();
            });
        }

        DB::statement('UPDATE '.$this->q('tenants').' SET '.$this->q('id_str').' = CAST('.$this->q('id').' AS CHAR) WHERE '.$this->q('id_str').' IS NULL');

        $tables = $this->tablesWithTenantIdExceptTenants();

        foreach ($tables as $table) {
            $info = $this->getTenantIdColumnInfo($table);
            if (! $info) {
                continue;
            }

            if (! in_array(strtolower((string) $info->data_type), ['bigint', 'int'], true)) {
                continue;
            }

            $nullableSql = strtoupper((string) $info->is_nullable) === 'YES' ? 'NULL' : 'NOT NULL';

            $this->dropForeignKeysOnTenantId($table);
            $this->dropIndexesOnTenantId($table);

            if (Schema::hasColumn($table, 'tenant_id_str')) {
                DB::statement('ALTER TABLE '.$this->q($table).' DROP COLUMN '.$this->q('tenant_id_str'));
            }

            DB::statement(
                'ALTER TABLE '.$this->q($table)
                .' ADD COLUMN '.$this->q('tenant_id_str').' VARCHAR(255) '.$nullableSql
            );

            DB::statement(
                'UPDATE '.$this->q($table).' t'
                .' SET t.'.$this->q('tenant_id_str').' = CAST(t.'.$this->q('tenant_id').' AS CHAR)'
                .' WHERE t.'.$this->q('tenant_id').' IS NOT NULL'
            );

            DB::statement('ALTER TABLE '.$this->q($table).' DROP COLUMN '.$this->q('tenant_id'));
            DB::statement(
                'ALTER TABLE '.$this->q($table)
                .' CHANGE COLUMN '.$this->q('tenant_id_str').' '.$this->q('tenant_id').' VARCHAR(255) '.$nullableSql
            );

            if ($table === 'user_tenant_access') {
                if (! $this->hasIndex($table, 'user_tenant_access_user_id_tenant_id_unique')) {
                    DB::statement(
                        'ALTER TABLE '.$this->q($table)
                        .' ADD UNIQUE KEY '.$this->q('user_tenant_access_user_id_tenant_id_unique')
                        .' ('.$this->q('user_id').', '.$this->q('tenant_id').')'
                    );
                }

                if (! $this->hasIndex($table, 'user_tenant_access_tenant_id_index')) {
                    DB::statement(
                        'ALTER TABLE '.$this->q($table)
                        .' ADD INDEX '.$this->q('user_tenant_access_tenant_id_index')
                        .' ('.$this->q('tenant_id').')'
                    );
                }

                continue;
            }

            $indexName = $table.'_tenant_id_index';
            if (! $this->hasIndex($table, $indexName)) {
                DB::statement(
                    'ALTER TABLE '.$this->q($table)
                    .' ADD INDEX '.$this->q($indexName)
                    .' ('.$this->q('tenant_id').')'
                );
            }
        }

        DB::statement('ALTER TABLE '.$this->q('tenants').' DROP PRIMARY KEY');
        DB::statement('ALTER TABLE '.$this->q('tenants').' DROP COLUMN '.$this->q('id'));
        DB::statement(
            'ALTER TABLE '.$this->q('tenants')
            .' CHANGE COLUMN '.$this->q('id_str').' '.$this->q('id').' VARCHAR(255) NOT NULL'
        );
        DB::statement('ALTER TABLE '.$this->q('tenants').' ADD PRIMARY KEY ('.$this->q('id').')');

        $this->reAddTenantForeignKeysString();
    }
};
