<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title }} {{ $voucher['voucher_no'] ?? '' }} | {{ $companyName }}</title>
    <style>
        :root {
            --ink: #16324f;
            --muted: #5d6b7b;
            --line: #d9e1ea;
            --soft: #f5f8fb;
            --accent: #0f5d8c;
            --accent-soft: #e9f4fb;
        }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            padding: 28px;
            font-family: DejaVu Sans, sans-serif;
            color: var(--ink);
            background: #fff;
        }
        .sheet { width: 100%; }
        .header {
            display: table;
            width: 100%;
            border-bottom: 2px solid var(--line);
            padding-bottom: 16px;
            margin-bottom: 18px;
        }
        .header-left, .header-right {
            display: table-cell;
            vertical-align: top;
        }
        .header-right {
            width: 34%;
            text-align: right;
        }
        .logo {
            max-height: 54px;
            margin-bottom: 10px;
        }
        .eyebrow {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.16em;
            color: var(--accent);
            margin-bottom: 6px;
        }
        h1 {
            margin: 0 0 6px;
            font-size: 28px;
            line-height: 1.1;
        }
        .subtle, .meta {
            color: var(--muted);
            font-size: 12px;
        }
        .meta strong { color: var(--ink); }
        .chip-row {
            margin-top: 12px;
        }
        .chip {
            display: inline-block;
            padding: 6px 10px;
            margin: 0 8px 8px 0;
            border: 1px solid var(--line);
            border-radius: 999px;
            background: #fff;
            color: var(--muted);
            font-size: 11px;
        }
        .chip.primary {
            border-color: #b8d3e5;
            background: var(--accent-soft);
            color: var(--ink);
        }
        .band {
            border: 1px solid var(--line);
            border-radius: 16px;
            background: linear-gradient(180deg, #ffffff 0%, #f9fbfd 100%);
            padding: 14px 16px;
            margin-bottom: 14px;
        }
        .band-title {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--muted);
            margin-bottom: 10px;
        }
        .field-table {
            width: 100%;
            border-collapse: collapse;
        }
        .field-table td {
            width: 25%;
            padding: 0 14px 10px 0;
            vertical-align: top;
        }
        .field-label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--muted);
            margin-bottom: 4px;
        }
        .field-value {
            border-bottom: 1px solid var(--line);
            padding: 4px 0 7px;
            min-height: 28px;
            font-size: 12px;
        }
        .two-col {
            width: 100%;
            border-collapse: separate;
            border-spacing: 12px 0;
            margin: 0 -12px;
        }
        .panel {
            border: 1px solid var(--line);
            border-radius: 14px;
            background: #fff;
            padding: 12px 14px;
            margin-bottom: 12px;
        }
        .panel-title {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--muted);
            margin-bottom: 8px;
        }
        .grid {
            width: 100%;
            border-collapse: collapse;
        }
        .grid td {
            padding: 4px 0;
            vertical-align: top;
            font-size: 12px;
        }
        .grid td:first-child {
            color: var(--muted);
            width: 34%;
            padding-right: 12px;
        }
        table.report {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 11px;
        }
        table.report th,
        table.report td {
            border: 1px solid var(--line);
            padding: 7px 8px;
            text-align: left;
        }
        table.report th {
            background: var(--soft);
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.06em;
        }
        td.numeric, th.numeric { text-align: right; }
        .notice {
            border: 1px solid #c9dfee;
            background: #f3f9fd;
            border-radius: 12px;
            padding: 10px 12px;
            color: #20506f;
            font-size: 12px;
            margin-top: 10px;
        }
        .totals {
            width: 360px;
            margin-left: auto;
            margin-top: 12px;
            border-collapse: collapse;
            font-size: 12px;
        }
        .totals td {
            border: 1px solid var(--line);
            padding: 8px 10px;
        }
        .totals td:first-child {
            background: var(--soft);
            color: var(--muted);
        }
        .totals .grand td {
            font-weight: 700;
            color: var(--ink);
        }
        .signatures {
            margin-top: 20px;
            display: table;
            width: 100%;
        }
        .sign-col {
            display: table-cell;
            width: 33.33%;
            padding-right: 16px;
            font-size: 11px;
        }
        .sign-line {
            margin-top: 38px;
            border-top: 1px solid var(--line);
            padding-top: 6px;
            color: var(--muted);
        }
        .text-block {
            min-height: 54px;
            font-size: 12px;
            line-height: 1.5;
            white-space: pre-line;
        }
        @media print {
            body { padding: 0; }
            .sheet { padding: 0; }
        }
    </style>
</head>
<body>
<div class="sheet">
    <div class="header">
        <div class="header-left">
            @if(!empty($logoDataUri))
                <img class="logo" src="{{ $logoDataUri }}" alt="{{ $companyName }} logo">
            @endif
            <div class="eyebrow">Accounting Document</div>
            <h1>{{ $title }}</h1>
            <div class="subtle">{{ $companyName }}</div>
            <div class="chip-row">
                <span class="chip primary">Status: {{ $voucher['status'] ?? '-' }}</span>
                <span class="chip">Mode: {{ $voucher['entry_mode'] ?? '-' }}</span>
                <span class="chip">Generated By: {{ $generatedBy ?? 'System' }}</span>
            </div>
        </div>
        <div class="header-right">
            <div class="meta"><strong>Voucher #:</strong> {{ $voucher['voucher_no'] ?? '-' }}</div>
            <div class="meta"><strong>Type:</strong> {{ $voucher['voucher_type'] ?? '-' }}</div>
            <div class="meta"><strong>Voucher Date:</strong> {{ $voucher['voucher_date'] ?? '-' }}</div>
            <div class="meta"><strong>Posting Date:</strong> {{ $voucher['posting_date'] ?? '-' }}</div>
            <div class="meta"><strong>Generated:</strong> {{ $generatedAt ?? '-' }}</div>
        </div>
    </div>

    <div class="band">
        <div class="band-title">Voucher Metadata</div>
        <table class="field-table">
            @for($i = 0; $i < count($headerFields); $i += 4)
                <tr>
                    @foreach(array_slice($headerFields, $i, 4) as $field)
                        <td>
                            <div class="field-label">{{ $field['label'] }}</div>
                            <div class="field-value">{{ $field['value'] }}</div>
                        </td>
                    @endforeach
                </tr>
            @endfor
        </table>
    </div>

    <table class="two-col">
        <tr>
            <td style="width: 50%; vertical-align: top;">
                <div class="panel">
                    <div class="panel-title">Payment Context</div>
                    <table class="grid">
                        @foreach($paymentContextFields as $field)
                            <tr>
                                <td>{{ $field['label'] }}</td>
                                <td>{{ $field['value'] }}</td>
                            </tr>
                        @endforeach
                    </table>
                </div>
            </td>
            <td style="width: 50%; vertical-align: top;">
                <div class="panel">
                    <div class="panel-title">Financial Context</div>
                    <table class="grid">
                        @foreach($financialContextFields as $field)
                            <tr>
                                <td>{{ $field['label'] }}</td>
                                <td>{{ $field['value'] }}</td>
                            </tr>
                        @endforeach
                    </table>
                </div>
            </td>
        </tr>
    </table>

    @if(!empty($paymentRows))
        <div class="panel">
            <div class="panel-title">{{ !empty($isSmartVoucher) ? 'Business Payment Rows' : 'Voucher Rows' }}</div>
            @if(($voucher['payment_for'] ?? '') === 'Expense')
                <table class="report">
                    <thead>
                    <tr>
                        <th>#</th>
                        <th style="width:40%;">Expense Account</th>
                        <th>Reference</th>
                        <th>Remarks</th>
                        <th class="numeric">Amount</th>
                    </tr>
                    </thead>
                    <tbody>
                    @foreach($paymentRows as $row)
                        <tr>
                            <td>{{ $row['row_no'] }}</td>
                            <td>{{ $row['expense_account'] ?? '-' }}</td>
                            <td>{{ $row['reference_no'] ?? '-' }}</td>
                            <td>{{ $row['remarks'] ?? '-' }}</td>
                            <td class="numeric">{{ $row['amount'] ?? '0.00' }}</td>
                        </tr>
                    @endforeach
                    </tbody>
                </table>
            @else
                <table class="report">
                    <thead>
                    <tr>
                        <th>#</th>
                        <th>Payment Mode</th>
                        <th>Invoice No</th>
                        <th class="numeric">Outstanding</th>
                        <th>Reference</th>
                        <th>Remarks</th>
                        <th class="numeric">Amount</th>
                    </tr>
                    </thead>
                    <tbody>
                    @foreach($paymentRows as $row)
                        <tr>
                            <td>{{ $row['row_no'] }}</td>
                            <td>{{ $row['payment_mode'] ?? '-' }}</td>
                            <td>{{ $row['invoice_no'] ?? '-' }}</td>
                            <td class="numeric">{{ $row['invoice_outstanding'] !== null ? number_format((float) $row['invoice_outstanding'], 2, '.', ',') : '-' }}</td>
                            <td>{{ $row['reference_no'] ?? '-' }}</td>
                            <td>{{ $row['remarks'] ?? '-' }}</td>
                            <td class="numeric">{{ $row['amount'] ?? '0.00' }}</td>
                        </tr>
                    @endforeach
                    </tbody>
                </table>
            @endif
        </div>
    @endif

    <div class="panel">
        <div class="panel-title">Posting Summary</div>
        <div class="notice">This voucher posts to the general ledger through the system-generated lines below.</div>
        <table class="report">
            <thead>
            <tr>
                <th style="width:34%;">Account</th>
                <th>Description</th>
                <th>Cost Center</th>
                <th>Source</th>
                <th class="numeric">Debit</th>
                <th class="numeric">Credit</th>
            </tr>
            </thead>
            <tbody>
            @forelse($postingLines as $line)
                <tr>
                    <td>{{ $line['account'] }}</td>
                    <td>{{ $line['description'] }}</td>
                    <td>{{ $line['cost_center'] }}</td>
                    <td>{{ $line['source'] }}</td>
                    <td class="numeric">{{ $line['debit'] }}</td>
                    <td class="numeric">{{ $line['credit'] }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="6">No voucher posting lines available.</td>
                </tr>
            @endforelse
            </tbody>
        </table>
    </div>

    @if(!empty($allocations))
        <div class="panel">
            <div class="panel-title">Invoice Allocation Summary</div>
            <table class="report">
                <thead>
                <tr>
                    <th>Invoice</th>
                    <th>Type</th>
                    <th>Party</th>
                    <th class="numeric">Allocated</th>
                    <th class="numeric">Remaining</th>
                    <th>Allocated At</th>
                </tr>
                </thead>
                <tbody>
                @foreach($allocations as $allocation)
                    <tr>
                        <td>{{ $allocation['invoice_no'] }}</td>
                        <td>{{ $allocation['invoice_type'] }}</td>
                        <td>{{ $allocation['party'] }}</td>
                        <td class="numeric">{{ $allocation['allocated_amount'] }}</td>
                        <td class="numeric">{{ $allocation['remaining_outstanding'] }}</td>
                        <td>{{ $allocation['allocated_at'] }}</td>
                    </tr>
                @endforeach
                </tbody>
            </table>
        </div>
    @endif

    <table class="two-col">
        <tr>
            <td style="width: 50%; vertical-align: top;">
                <div class="panel">
                    <div class="panel-title">Remarks</div>
                    <div class="text-block">{{ $remarks ?? '-' }}</div>
                </div>
            </td>
            <td style="width: 50%; vertical-align: top;">
                <div class="panel">
                    <div class="panel-title">System Narration</div>
                    <div class="text-block">{{ $systemNarration ?? '-' }}</div>
                </div>
            </td>
        </tr>
    </table>

    <table class="totals">
        <tr><td>Voucher Total</td><td style="text-align:right;">{{ $totals['voucher_total'] ?? '0.00' }}</td></tr>
        <tr><td>Debit Total</td><td style="text-align:right;">{{ $totals['debit_total'] ?? '0.00' }}</td></tr>
        <tr><td>Credit Total</td><td style="text-align:right;">{{ $totals['credit_total'] ?? '0.00' }}</td></tr>
        <tr class="grand"><td>Difference</td><td style="text-align:right;">{{ $totals['difference'] ?? '0.00' }}</td></tr>
    </table>

    <div class="signatures">
        <div class="sign-col">
            <div class="sign-line">
                <div>Prepared By</div>
                <div><strong>{{ $audit['prepared_by'] ?? 'N/A' }}</strong></div>
                <div>{{ $audit['prepared_at'] ?? 'N/A' }}</div>
            </div>
        </div>
        <div class="sign-col">
            <div class="sign-line">
                <div>Approved By</div>
                <div><strong>{{ $audit['approved_by'] ?? 'N/A' }}</strong></div>
                <div>{{ $audit['approved_at'] ?? 'N/A' }}</div>
            </div>
        </div>
        <div class="sign-col">
            <div class="sign-line">
                <div>Posted By</div>
                <div><strong>{{ $audit['posted_by'] ?? 'N/A' }}</strong></div>
                <div>{{ $audit['posted_at'] ?? 'N/A' }}</div>
            </div>
        </div>
    </div>
</div>

@if(!empty($autoPrint))
    <script>
        window.addEventListener('load', function () {
            setTimeout(function () { window.print(); }, 250);
        });
    </script>
@endif
</body>
</html>
