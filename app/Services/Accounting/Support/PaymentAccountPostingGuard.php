<?php

namespace App\Services\Accounting\Support;

use App\Models\CoaAccount;
use App\Models\PaymentAccount;
use Illuminate\Validation\ValidationException;

class PaymentAccountPostingGuard
{
    public function validateRequiredForPosting(mixed $accountInput, ?string $paymentMethod = null, string $field = 'payment_account_id'): PaymentAccount
    {
        if ($accountInput === null || $accountInput === '') {
            throw ValidationException::withMessages([
                $field => 'A valid payment account is required for accounting posting.',
            ]);
        }

        $paymentAccount = $this->resolveAccount($accountInput);
        if (!$paymentAccount || $paymentAccount->trashed()) {
            throw ValidationException::withMessages([
                $field => 'The selected payment account could not be found.',
            ]);
        }

        $status = strtolower(trim((string) ($paymentAccount->status ?? 'active')));
        if ($status !== '' && $status !== 'active') {
            throw ValidationException::withMessages([
                $field => "Payment account '{$paymentAccount->name}' is inactive.",
            ]);
        }

        $coaAccount = $paymentAccount->coaAccount;
        if (!$coaAccount instanceof CoaAccount) {
            throw ValidationException::withMessages([
                $field => "Payment account '{$paymentAccount->name}' is missing a mapped chart of account.",
            ]);
        }

        if (!$coaAccount->is_active || !$coaAccount->is_postable) {
            throw ValidationException::withMessages([
                $field => "Payment account '{$paymentAccount->name}' is mapped to an inactive or non-postable chart of account.",
            ]);
        }

        if ($paymentMethod) {
            $this->assertMethodCompatibility($paymentAccount, $paymentMethod, $field);
        }

        return $paymentAccount;
    }

    private function resolveAccount(mixed $accountInput): ?PaymentAccount
    {
        $query = PaymentAccount::withTrashed()->with('coaAccount');

        if (is_numeric($accountInput)) {
            return $query->find((int) $accountInput);
        }

        $accountName = trim((string) $accountInput);
        if ($accountName === '') {
            return null;
        }

        return $query->where('name', $accountName)->first();
    }

    private function assertMethodCompatibility(PaymentAccount $paymentAccount, string $paymentMethod, string $field): void
    {
        $normalizedMethod = strtolower(trim($paymentMethod));
        $accountMethod = strtolower(trim((string) ($paymentAccount->payment_method ?? '')));

        if ($accountMethod === '') {
            return;
        }

        $allowedByMethod = [
            'cash' => ['cash'],
            'bank' => ['bank', 'bank_transfer', 'online'],
            'bank_transfer' => ['bank', 'bank_transfer', 'online'],
            'online' => ['online', 'bank', 'bank_transfer'],
            'cheque' => ['cheque', 'bank', 'bank_transfer'],
            'credit_card' => ['credit_card', 'online', 'bank', 'bank_transfer'],
            'debit_card' => ['debit_card', 'online', 'bank', 'bank_transfer'],
        ];

        $allowed = $allowedByMethod[$normalizedMethod] ?? null;
        if ($allowed && !in_array($accountMethod, $allowed, true)) {
            throw ValidationException::withMessages([
                $field => "Payment account '{$paymentAccount->name}' is not compatible with {$paymentMethod} payments.",
            ]);
        }
    }
}
