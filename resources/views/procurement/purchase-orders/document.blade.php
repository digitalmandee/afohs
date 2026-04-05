<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title }} {{ $po['number'] ?? '' }} | {{ $companyName }}</title>
    <style>
        :root {
            --ink: #16324f;
            --muted: #5d6b7b;
            --line: #d9e1ea;
            --soft: #f5f8fb;
            --accent: #0f5d8c;
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
            text-align: right;
            width: 36%;
        }
        .logo {
            max-height: 52px;
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
            padding: 3px 0;
            vertical-align: top;
            font-size: 12px;
        }
        .grid td:first-child {
            color: var(--muted);
            width: 30%;
            padding-right: 12px;
        }
        table.report {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
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
        .totals {
            width: 320px;
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
                <div class="eyebrow">Procurement Document</div>
                <h1>{{ $title }}</h1>
                <div class="subtle">{{ $companyName }}</div>
            </div>
            <div class="header-right">
                <div class="meta"><strong>PO #:</strong> {{ $po['number'] ?? '-' }}</div>
                <div class="meta"><strong>Status:</strong> {{ $po['status'] ?? '-' }}</div>
                <div class="meta"><strong>Order Date:</strong> {{ $po['order_date'] ?? '-' }}</div>
                <div class="meta"><strong>Currency:</strong> {{ $po['currency'] ?? 'PKR' }}</div>
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
                        <div class="panel-title">Order Details</div>
                        <table class="grid">
                            <tr><td>Order Date</td><td>{{ $po['order_date'] ?? '-' }}</td></tr>
                            <tr><td>Expected Date</td><td>{{ $po['expected_date'] ?? '-' }}</td></tr>
                            <tr><td>Warehouse</td><td>{{ $po['warehouse'] ?? '-' }}</td></tr>
                            <tr><td>Restaurant</td><td>{{ $po['restaurant'] ?? '-' }}</td></tr>
                            <tr><td>Currency</td><td>{{ $po['currency'] ?? 'PKR' }}</td></tr>
                        </table>
                    </div>
                </td>
            </tr>
        </table>

        <table class="report">
            <thead>
                <tr>
                    <th style="width:35%;">Item</th>
                    <th>SKU</th>
                    <th>UoM</th>
                    <th class="numeric">Qty Ordered</th>
                    <th class="numeric">Unit Cost</th>
                    <th class="numeric">Line Total</th>
                </tr>
            </thead>
            <tbody>
                @forelse($lineItems as $line)
                    <tr>
                        <td>{{ $line['item_name'] }}</td>
                        <td>{{ $line['sku'] }}</td>
                        <td>{{ $line['uom'] }}</td>
                        <td class="numeric">{{ $line['qty_ordered'] }}</td>
                        <td class="numeric">{{ $line['unit_cost'] }}</td>
                        <td class="numeric">{{ $line['line_total'] }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="6">No line items available.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>

        <table class="totals">
            <tr><td>Sub Total</td><td style="text-align:right;">{{ $totals['sub_total'] ?? '0.00' }}</td></tr>
            <tr><td>Tax</td><td style="text-align:right;">{{ $totals['tax_total'] ?? '0.00' }}</td></tr>
            <tr><td>Discount</td><td style="text-align:right;">{{ $totals['discount_total'] ?? '0.00' }}</td></tr>
            <tr class="grand"><td>Grand Total</td><td style="text-align:right;">{{ $totals['grand_total'] ?? '0.00' }}</td></tr>
        </table>

        <table style="width:100%; border-collapse:separate; border-spacing:10px 0; margin:14px -10px 0;">
            <tr>
                <td style="width:50%; vertical-align:top;">
                    <div class="panel">
                        <div class="panel-title">Commercial Summary</div>
                        <table class="grid">
                            <tr><td>Sub Total</td><td>{{ $totals['sub_total'] ?? '0.00' }}</td></tr>
                            <tr><td>Tax Total</td><td>{{ $totals['tax_total'] ?? '0.00' }}</td></tr>
                            <tr><td>Discount Total</td><td>{{ $totals['discount_total'] ?? '0.00' }}</td></tr>
                            <tr><td>Grand Total</td><td><strong>{{ $totals['grand_total'] ?? '0.00' }}</strong></td></tr>
                        </table>
                    </div>
                </td>
                <td style="width:50%; vertical-align:top;">
                    <div class="panel">
                        <div class="panel-title">Audit Trail</div>
                        <table class="grid">
                            <tr><td>Created By</td><td>{{ $po['created_by'] ?? 'N/A' }}</td></tr>
                            <tr><td>Created At</td><td>{{ $po['created_at'] ?? 'N/A' }}</td></tr>
                            <tr><td>Approved By</td><td>{{ $po['approved_by'] ?? 'N/A' }}</td></tr>
                            <tr><td>Approved At</td><td>{{ $po['approved_at'] ?? 'N/A' }}</td></tr>
                        </table>
                    </div>
                </td>
            </tr>
        </table>

        <div class="panel" style="margin-top:16px;">
            <div class="panel-title">Remarks</div>
            <div style="font-size:12px;">{{ $po['remarks'] ?? '-' }}</div>
        </div>

        <div class="signatures">
            <div class="sign-col">
                <div class="sign-line">
                    <div>Prepared By</div>
                    <div><strong>{{ $signatories['prepared_by_name'] ?? 'N/A' }}</strong></div>
                    <div>{{ $signatories['prepared_at'] ?? 'N/A' }}</div>
                </div>
            </div>
            <div class="sign-col">
                <div class="sign-line">
                    <div>Verified By</div>
                    <div><strong>{{ $signatories['verified_by_name'] ?? 'Pending' }}</strong></div>
                    <div>{{ $signatories['verified_at'] ?? 'Pending' }}</div>
                </div>
            </div>
            <div class="sign-col">
                <div class="sign-line">
                    <div>Accepted By</div>
                    <div><strong>{{ $signatories['accepted_by_name'] ?? 'Pending' }}</strong></div>
                    <div>{{ $signatories['accepted_at'] ?? 'Pending' }}</div>
                </div>
            </div>
        </div>
    </div>

    @if(!empty($autoPrint))
        <script>
            window.addEventListener('load', function () {
                setTimeout(function () {
                    window.print();
                }, 250);
            });
        </script>
    @endif
</body>
</html>
