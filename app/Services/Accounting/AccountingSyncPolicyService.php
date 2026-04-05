<?php

namespace App\Services\Accounting;

use App\Models\Setting;

class AccountingSyncPolicyService
{
    private const GROUP = 'accounting_sync_policy';

    public function all(): array
    {
        $stored = Setting::getGroup(self::GROUP);

        return array_merge($this->defaults(), is_array($stored) ? $stored : []);
    }

    public function isStrictForEvent(string $eventType): bool
    {
        $policy = $this->all();
        $strict = (array) ($policy['strict_event_types'] ?? []);

        return in_array($eventType, $strict, true);
    }

    public function update(array $data): array
    {
        $next = array_merge($this->all(), $data);
        Setting::updateGroup(self::GROUP, $next);

        return $next;
    }

    private function defaults(): array
    {
        return [
            'strict_event_types' => [
                'invoice_created',
                'receipt_created',
                'goods_receipt_posted',
                'vendor_bill_posted',
                'vendor_payment_posted',
                'supplier_advance_posted',
                'accounting_voucher_posted',
            ],
        ];
    }
}

