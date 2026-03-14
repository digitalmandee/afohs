<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\BankReconciliationSession;
use App\Models\FinancialReceipt;
use App\Models\PaymentAccount;
use App\Models\VendorPayment;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class BankReconciliationController extends Controller
{
    public function index(Request $request)
    {
        $sessionsQuery = BankReconciliationSession::query()->with('paymentAccount:id,name,payment_method');

        if ($request->filled('payment_account_id')) {
            $sessionsQuery->where('payment_account_id', $request->payment_account_id);
        }

        if ($request->filled('status') && in_array($request->status, ['draft', 'reconciled', 'locked'], true)) {
            $sessionsQuery->where('status', $request->status);
        }

        $sessions = $sessionsQuery->orderByDesc('statement_end_date')->paginate(20)->withQueryString();
        $activeSession = null;
        $bookSnapshot = null;

        $activeSessionId = $request->filled('session_id') ? (int) $request->session_id : null;
        if ($activeSessionId) {
            $activeSession = BankReconciliationSession::with('lines')->find($activeSessionId);
            if ($activeSession) {
                $bookSnapshot = $this->bookSnapshot(
                    (int) $activeSession->payment_account_id,
                    $activeSession->statement_start_date->toDateString(),
                    $activeSession->statement_end_date->toDateString()
                );
            }
        }

        return Inertia::render('App/Admin/Accounting/Banking/Reconciliation', [
            'sessions' => $sessions,
            'paymentAccounts' => PaymentAccount::query()
                ->whereIn('payment_method', ['bank', 'bank_transfer', 'online', 'cheque'])
                ->orderBy('name')
                ->get(['id', 'name', 'payment_method']),
            'filters' => $request->only(['payment_account_id', 'status', 'session_id']),
            'activeSession' => $activeSession,
            'bookSnapshot' => $bookSnapshot,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'payment_account_id' => 'required|exists:payment_accounts,id',
            'statement_start_date' => 'required|date',
            'statement_end_date' => 'required|date|after_or_equal:statement_start_date',
            'statement_opening_balance' => 'required|numeric',
            'statement_closing_balance' => 'required|numeric',
            'notes' => 'nullable|string',
            'statement_file' => 'nullable|file|mimes:csv,txt',
            'lines' => 'nullable|array',
            'lines.*.txn_date' => 'required|date',
            'lines.*.reference_no' => 'nullable|string|max:255',
            'lines.*.description' => 'nullable|string|max:255',
            'lines.*.direction' => 'required|in:inflow,outflow',
            'lines.*.amount' => 'required|numeric|min:0.01',
        ]);

        $snapshot = $this->bookSnapshot(
            (int) $data['payment_account_id'],
            $data['statement_start_date'],
            $data['statement_end_date']
        );

        $session = DB::transaction(function () use ($request, $data, $snapshot) {
            $session = BankReconciliationSession::create([
                'payment_account_id' => $data['payment_account_id'],
                'statement_start_date' => $data['statement_start_date'],
                'statement_end_date' => $data['statement_end_date'],
                'statement_opening_balance' => $data['statement_opening_balance'],
                'statement_closing_balance' => $data['statement_closing_balance'],
                'book_opening_balance' => $snapshot['opening_balance'],
                'book_closing_balance' => $snapshot['closing_balance'],
                'difference_amount' => (float) $data['statement_closing_balance'] - (float) $snapshot['closing_balance'],
                'status' => 'draft',
                'notes' => $data['notes'] ?? null,
                'created_by' => $request->user()?->id,
            ]);

            $csvLines = $this->parseStatementCsv($request->file('statement_file'));
            $allLines = collect((array) ($data['lines'] ?? []))
                ->concat($csvLines)
                ->filter(fn ($row) => !empty($row['txn_date']) && !empty($row['direction']) && (float) ($row['amount'] ?? 0) > 0)
                ->values();

            foreach ($allLines as $line) {
                $session->lines()->create([
                    'txn_date' => $line['txn_date'],
                    'reference_no' => $line['reference_no'] ?? null,
                    'description' => $line['description'] ?? null,
                    'direction' => $line['direction'],
                    'amount' => $line['amount'],
                    'status' => 'unmatched',
                ]);
            }

            return $session;
        });

        return redirect()->route('accounting.bank-reconciliation.index', ['session_id' => $session->id])->with('success', 'Reconciliation session created.');
    }

    public function autoMatch(BankReconciliationSession $session)
    {
        $snapshot = $this->bookSnapshot(
            (int) $session->payment_account_id,
            $session->statement_start_date->toDateString(),
            $session->statement_end_date->toDateString()
        );

        $bookRows = collect($snapshot['transactions']);

        DB::transaction(function () use ($session, $bookRows, $snapshot) {
            foreach ($session->lines as $line) {
                if ($line->status === 'adjustment') {
                    continue;
                }

                $match = $bookRows->first(function ($row) use ($line) {
                    if ($row['direction'] !== $line->direction) {
                        return false;
                    }
                    if (abs((float) $row['amount'] - (float) $line->amount) > 0.01) {
                        return false;
                    }
                    $rowDate = Carbon::parse($row['txn_date']);
                    $lineDate = Carbon::parse($line->txn_date);
                    return $rowDate->diffInDays($lineDate) <= 3;
                });

                if ($match) {
                    $line->update([
                        'status' => 'matched',
                        'matched_reference' => (string) ($match['reference'] ?? $match['source'] . ':' . $match['id']),
                    ]);
                } else {
                    $line->update([
                        'status' => 'unmatched',
                        'matched_reference' => null,
                    ]);
                }
            }

            $session->refresh();
            $unmatched = $session->lines()->where('status', 'unmatched')->count();
            $difference = (float) $session->statement_closing_balance - (float) $snapshot['closing_balance'];

            $session->update([
                'book_opening_balance' => $snapshot['opening_balance'],
                'book_closing_balance' => $snapshot['closing_balance'],
                'difference_amount' => $difference,
                'status' => ($unmatched === 0 && abs($difference) < 0.01) ? 'reconciled' : 'draft',
                'reconciled_at' => ($unmatched === 0 && abs($difference) < 0.01) ? now() : null,
                'reconciled_by' => ($unmatched === 0 && abs($difference) < 0.01) ? auth()->id() : null,
            ]);
        });

        return redirect()->back()->with('success', 'Auto-match run completed.');
    }

    private function bookSnapshot(int $paymentAccountId, string $from, string $to): array
    {
        if (!Schema::hasTable('financial_receipts') || !Schema::hasTable('vendor_payments')) {
            return [
                'opening_balance' => 0.0,
                'closing_balance' => 0.0,
                'period_inflows' => 0.0,
                'period_outflows' => 0.0,
                'transactions' => [],
            ];
        }

        $inflowsBefore = (float) FinancialReceipt::query()
            ->where('payment_account_id', $paymentAccountId)
            ->whereDate('receipt_date', '<', $from)
            ->sum('amount');
        $outflowsBefore = (float) VendorPayment::query()
            ->where('payment_account_id', $paymentAccountId)
            ->whereNotIn('status', ['void'])
            ->whereDate('payment_date', '<', $from)
            ->sum('amount');

        $inflows = FinancialReceipt::query()
            ->where('payment_account_id', $paymentAccountId)
            ->whereBetween(DB::raw('DATE(receipt_date)'), [$from, $to])
            ->get(['id', 'receipt_no', 'receipt_date', 'amount'])
            ->map(fn ($row) => [
                'id' => $row->id,
                'source' => 'financial_receipt',
                'reference' => $row->receipt_no,
                'txn_date' => optional($row->receipt_date)->toDateString(),
                'direction' => 'inflow',
                'amount' => (float) $row->amount,
            ]);

        $outflows = VendorPayment::query()
            ->where('payment_account_id', $paymentAccountId)
            ->whereNotIn('status', ['void'])
            ->whereBetween(DB::raw('DATE(payment_date)'), [$from, $to])
            ->get(['id', 'payment_no', 'payment_date', 'amount'])
            ->map(fn ($row) => [
                'id' => $row->id,
                'source' => 'vendor_payment',
                'reference' => $row->payment_no,
                'txn_date' => optional($row->payment_date)->toDateString(),
                'direction' => 'outflow',
                'amount' => (float) $row->amount,
            ]);

        $transactions = $inflows
            ->concat($outflows)
            ->sortBy('txn_date')
            ->values();

        $periodInflows = (float) $inflows->sum('amount');
        $periodOutflows = (float) $outflows->sum('amount');
        $opening = $inflowsBefore - $outflowsBefore;
        $closing = $opening + $periodInflows - $periodOutflows;

        return [
            'opening_balance' => round($opening, 2),
            'closing_balance' => round($closing, 2),
            'period_inflows' => round($periodInflows, 2),
            'period_outflows' => round($periodOutflows, 2),
            'transactions' => $transactions->all(),
        ];
    }

    private function parseStatementCsv(?UploadedFile $file): array
    {
        if (!$file) {
            return [];
        }

        $handle = fopen($file->getRealPath(), 'r');
        if (!$handle) {
            return [];
        }

        $rows = [];
        $headers = [];
        $lineNo = 0;

        while (($row = fgetcsv($handle)) !== false) {
            $lineNo++;
            $row = array_map(fn ($value) => trim((string) $value), $row);
            if (count(array_filter($row, fn ($v) => $v !== '')) === 0) {
                continue;
            }

            if ($lineNo === 1) {
                $first = strtolower((string) ($row[0] ?? ''));
                if (in_array($first, ['date', 'txn_date', 'transaction_date'], true)) {
                    $headers = array_map(fn ($h) => strtolower((string) $h), $row);
                    continue;
                }
            }

            $record = [];
            if (!empty($headers)) {
                foreach ($headers as $idx => $header) {
                    $record[$header] = $row[$idx] ?? null;
                }
            } else {
                $record = [
                    'date' => $row[0] ?? null,
                    'reference' => $row[1] ?? null,
                    'description' => $row[2] ?? null,
                    'direction' => $row[3] ?? null,
                    'amount' => $row[4] ?? null,
                ];
            }

            $txnDate = $record['txn_date'] ?? $record['transaction_date'] ?? $record['date'] ?? null;
            $reference = $record['reference_no'] ?? $record['reference'] ?? null;
            $description = $record['description'] ?? null;
            $directionRaw = strtolower((string) ($record['direction'] ?? ''));
            $amountRaw = $record['amount'] ?? null;

            if ($amountRaw === null || $amountRaw === '') {
                $debit = (float) ($record['debit'] ?? 0);
                $credit = (float) ($record['credit'] ?? 0);
                if ($credit > 0) {
                    $amountRaw = $credit;
                    $directionRaw = 'inflow';
                } elseif ($debit > 0) {
                    $amountRaw = $debit;
                    $directionRaw = 'outflow';
                }
            }

            $amount = (float) preg_replace('/[^0-9\.\-]/', '', (string) $amountRaw);
            if ($amount <= 0 || !$txnDate) {
                continue;
            }

            if (!in_array($directionRaw, ['inflow', 'outflow'], true)) {
                $directionRaw = $amount >= 0 ? 'inflow' : 'outflow';
            }

            $rows[] = [
                'txn_date' => Carbon::parse($txnDate)->toDateString(),
                'reference_no' => $reference,
                'description' => $description,
                'direction' => $directionRaw,
                'amount' => abs($amount),
            ];
        }

        fclose($handle);

        return $rows;
    }
}
