<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title }} {{ $bill['number'] ?? '' }} | {{ $companyName }}</title>
    <style>
        :root { --ink:#16324f; --muted:#5d6b7b; --line:#d9e1ea; --soft:#f5f8fb; --accent:#0f5d8c; }
        * { box-sizing: border-box; }
        body { margin: 0; padding: 28px; font-family: DejaVu Sans, sans-serif; color: var(--ink); background: #fff; }
        .sheet { width: 100%; }
        .header { display: table; width: 100%; border-bottom: 2px solid var(--line); padding-bottom: 16px; margin-bottom: 18px; }
        .header-left, .header-right { display: table-cell; vertical-align: top; }
        .header-right { text-align: right; width: 36%; }
        .logo { max-height: 52px; margin-bottom: 10px; }
        .eyebrow { font-size: 11px; text-transform: uppercase; letter-spacing: 0.16em; color: var(--accent); margin-bottom: 6px; }
        h1 { margin: 0 0 6px; font-size: 28px; line-height: 1.1; }
        .subtle, .meta { color: var(--muted); font-size: 12px; }
        .meta strong { color: var(--ink); }
        .panel { border: 1px solid var(--line); border-radius: 14px; background: #fff; padding: 12px 14px; margin-bottom: 12px; }
        .panel-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); margin-bottom: 8px; }
        .grid { width: 100%; border-collapse: collapse; }
        .grid td { padding: 3px 0; vertical-align: top; font-size: 12px; }
        .grid td:first-child { color: var(--muted); width: 33%; padding-right: 12px; }
        table.report { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 11px; }
        table.report th, table.report td { border: 1px solid var(--line); padding: 7px 8px; text-align: left; }
        table.report th { background: var(--soft); font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; }
        td.numeric, th.numeric { text-align: right; }
        .totals { width: 340px; margin-left: auto; margin-top: 12px; border-collapse: collapse; font-size: 12px; }
        .totals td { border: 1px solid var(--line); padding: 8px 10px; }
        .totals td:first-child { background: var(--soft); color: var(--muted); }
        .totals .grand td { font-weight: 700; color: var(--ink); }
        .signatures { margin-top: 20px; display: table; width: 100%; }
        .sign-col { display: table-cell; width: 50%; padding-right: 16px; font-size: 11px; }
        .sign-line { margin-top: 38px; border-top: 1px solid var(--line); padding-top: 6px; color: var(--muted); }
        @media print { body { padding: 0; } .sheet { padding: 0; } }
    </style>
</head>
<body>
<div class="sheet">
    <div class="header">
        <div class="header-left">
            @if(!empty($logoDataUri))
                <img class="logo" src="{{ $logoDataUri }}" alt="{{ $companyName }} logo">
            @endif
            <div class="eyebrow">Procurement Document</div>
            <h1>{{ $title }}</h1>
            <div class="subtle">{{ $companyName }}</div>
        </div>
        <div class="header-right">
            <div class="meta"><strong>Bill #:</strong> {{ $bill['number'] ?? '-' }}</div>
            <div class="meta"><strong>Status:</strong> {{ $bill['status'] ?? '-' }}</div>
            <div class="meta"><strong>Bill Date:</strong> {{ $bill['bill_date'] ?? '-' }}</div>
            <div class="meta"><strong>Generated:</strong> {{ $generatedAt ?? '-' }}</div>
        </div>
    </div>

    <table style="width:100%; border-collapse:separate; border-spacing:10px 0; margin:0 -10px;">
        <tr>
            <td style="width:50%; vertical-align:top;">
                <div class="panel">
                    <div class="panel-title">Vendor</div>
                    <table class="grid">
                        <tr><td>Name</td><td>{{ $vendor['name'] ?? '-' }}</td></tr>
                        <tr><td>Code</td><td>{{ $vendor['code'] ?? '-' }}</td></tr>
                        <tr><td>Phone</td><td>{{ $vendor['phone'] ?? '-' }}</td></tr>
                        <tr><td>Email</td><td>{{ $vendor['email'] ?? '-' }}</td></tr>
                        <tr><td>Address</td><td>{{ $vendor['address'] ?? '-' }}</td></tr>
                    </table>
                </div>
            </td>
            <td style="width:50%; vertical-align:top;">
                <div class="panel">
                    <div class="panel-title">Bill Details</div>
                    <table class="grid">
                        <tr><td>Bill Date</td><td>{{ $bill['bill_date'] ?? '-' }}</td></tr>
                        <tr><td>Due Date</td><td>{{ $bill['due_date'] ?? '-' }}</td></tr>
                        <tr><td>GRN No</td><td>{{ $bill['grn_no'] ?? '-' }}</td></tr>
                        <tr><td>GRN Date</td><td>{{ $bill['grn_date'] ?? '-' }}</td></tr>
                        <tr><td>Currency</td><td>{{ $bill['currency'] ?? 'PKR' }}</td></tr>
                    </table>
                </div>
            </td>
        </tr>
    </table>

    <table class="report">
        <thead>
        <tr>
            <th style="width:30%;">Item</th>
            <th>SKU</th>
            <th>UoM</th>
            <th class="numeric">Qty</th>
            <th class="numeric">Unit Cost</th>
            <th class="numeric">Tax</th>
            <th class="numeric">Discount</th>
            <th class="numeric">Line Total</th>
        </tr>
        </thead>
        <tbody>
        @forelse($lineItems as $line)
            <tr>
                <td>{{ $line['item_name'] }}</td>
                <td>{{ $line['sku'] }}</td>
                <td>{{ $line['uom'] }}</td>
                <td class="numeric">{{ $line['qty'] }}</td>
                <td class="numeric">{{ $line['unit_cost'] }}</td>
                <td class="numeric">{{ $line['tax_amount'] }}</td>
                <td class="numeric">{{ $line['discount_amount'] }}</td>
                <td class="numeric">{{ $line['line_total'] }}</td>
            </tr>
        @empty
            <tr><td colspan="8">No line items available.</td></tr>
        @endforelse
        </tbody>
    </table>

    @if(!empty($otherCharges))
        <div class="panel" style="margin-top:12px;">
            <div class="panel-title">Other Charges</div>
            <table class="grid">
                @foreach($otherCharges as $charge)
                    <tr>
                        <td>{{ $charge['description'] }}</td>
                        <td style="text-align:right;">{{ $charge['amount'] }}</td>
                    </tr>
                @endforeach
            </table>
        </div>
    @endif

    <table class="totals">
        <tr><td>Sub Total</td><td style="text-align:right;">{{ $totals['sub_total'] ?? '0.00' }}</td></tr>
        <tr><td>Tax Total</td><td style="text-align:right;">{{ $totals['tax_total'] ?? '0.00' }}</td></tr>
        <tr><td>Discount Total</td><td style="text-align:right;">{{ $totals['discount_total'] ?? '0.00' }}</td></tr>
        <tr><td>Other Charges</td><td style="text-align:right;">{{ $totals['other_charges_total'] ?? '0.00' }}</td></tr>
        <tr class="grand"><td>Grand Total</td><td style="text-align:right;">{{ $totals['grand_total'] ?? '0.00' }}</td></tr>
    </table>

    <div class="panel" style="margin-top:16px;">
        <div class="panel-title">Remarks</div>
        <div style="font-size:12px;">{{ $bill['remarks'] ?? '-' }}</div>
    </div>

    <div class="signatures">
        <div class="sign-col">
            <div class="sign-line">
                <div>Prepared By</div>
                <div><strong>{{ $bill['created_by'] ?? 'N/A' }}</strong></div>
                <div>{{ $bill['created_at'] ?? 'N/A' }}</div>
            </div>
        </div>
        <div class="sign-col">
            <div class="sign-line">
                <div>Posted By</div>
                <div><strong>{{ $bill['posted_by'] ?? 'Pending' }}</strong></div>
                <div>{{ $bill['posted_at'] ?? 'Pending' }}</div>
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

