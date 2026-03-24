<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title }} | {{ $companyName }}</title>
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
        .sheet {
            width: 100%;
        }
        .header {
            display: table;
            width: 100%;
            border-bottom: 2px solid var(--line);
            padding-bottom: 16px;
            margin-bottom: 20px;
        }
        .header-left, .header-right {
            display: table-cell;
            vertical-align: top;
        }
        .header-right {
            text-align: right;
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
        .subtle, .meta, .badge {
            color: var(--muted);
            font-size: 12px;
        }
        .meta strong {
            color: var(--ink);
        }
        .filters {
            margin: 18px 0 20px;
            padding: 14px 16px;
            background: var(--soft);
            border: 1px solid var(--line);
            border-radius: 14px;
        }
        .filters h2,
        .metrics h2,
        .section-title {
            margin: 0 0 10px;
            font-size: 14px;
        }
        .filter-grid, .metric-grid {
            width: 100%;
        }
        .filter-grid td, .metric-grid td {
            padding: 4px 8px 4px 0;
            vertical-align: top;
        }
        .metric-card {
            border: 1px solid var(--line);
            border-radius: 14px;
            padding: 12px 14px;
            background: #fff;
        }
        .metric-label {
            display: block;
            margin-bottom: 6px;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--muted);
        }
        .metric-value {
            font-size: 20px;
            font-weight: 700;
            color: var(--ink);
        }
        .badges {
            margin: 12px 0 18px;
        }
        .badge {
            display: inline-block;
            padding: 6px 10px;
            margin: 0 8px 8px 0;
            border: 1px solid var(--line);
            border-radius: 999px;
            background: #fff;
        }
        .section {
            margin-top: 18px;
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
        td.numeric, th.numeric {
            text-align: right;
        }
        .error {
            padding: 12px 14px;
            border: 1px solid #efc6c6;
            background: #fff8f8;
            color: #8b2d2d;
            border-radius: 12px;
            margin: 16px 0;
            font-size: 12px;
        }
        @media print {
            body {
                padding: 0;
            }
            .sheet {
                padding: 0;
            }
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
                <div class="eyebrow">Accounting Report</div>
                <h1>{{ $title }}</h1>
                <div class="subtle">{{ $companyName }}</div>
            </div>
            <div class="header-right">
                <div class="meta"><strong>Generated:</strong> {{ $generatedAt }}</div>
                @if(!empty($filters['from']) || !empty($filters['to']))
                    <div class="meta"><strong>Range:</strong> {{ $filters['from'] ?? 'Start' }} - {{ $filters['to'] ?? 'End' }}</div>
                @endif
            </div>
        </div>

        @if(!empty($error))
            <div class="error">{{ $error }}</div>
        @endif

        @if(!empty($filters))
            <div class="filters">
                <h2>Applied Filters</h2>
                <table class="filter-grid">
                    @foreach(array_chunk($filters, 3, true) as $chunk)
                        <tr>
                            @foreach($chunk as $label => $value)
                                <td><strong>{{ $label }}:</strong> {{ $value }}</td>
                            @endforeach
                        </tr>
                    @endforeach
                </table>
            </div>
        @endif

        @if(!empty($metrics))
            <div class="metrics">
                <h2>Summary</h2>
                <table class="metric-grid">
                    <tr>
                        @foreach($metrics as $metric)
                            <td width="{{ floor(100 / max(count($metrics), 1)) }}%">
                                <div class="metric-card">
                                    <span class="metric-label">{{ $metric['label'] ?? '' }}</span>
                                    <span class="metric-value">{{ $metric['value'] ?? '' }}</span>
                                </div>
                            </td>
                        @endforeach
                    </tr>
                </table>
            </div>
        @endif

        @if(!empty($badges))
            <div class="badges">
                @foreach($badges as $badge)
                    <span class="badge">{{ $badge }}</span>
                @endforeach
            </div>
        @endif

        @foreach($sections as $section)
            <div class="section">
                <div class="section-title">{{ $section['title'] ?? 'Report Section' }}</div>
                @if(!empty($section['rows']))
                    <table class="report">
                        <thead>
                            <tr>
                                @foreach(($section['columns'] ?? []) as $column)
                                    <th class="{{ in_array($column, ['Debit', 'Credit', 'Balance', 'Total', 'Paid', 'Current', 'Previous', 'Delta', 'Change %', 'Age Days'], true) ? 'numeric' : '' }}">{{ $column }}</th>
                                @endforeach
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($section['rows'] as $row)
                                <tr>
                                    @foreach(($section['columns'] ?? []) as $column)
                                        <td class="{{ in_array($column, ['Debit', 'Credit', 'Balance', 'Total', 'Paid', 'Current', 'Previous', 'Delta', 'Change %', 'Age Days'], true) ? 'numeric' : '' }}">
                                            {{ data_get($row, $column, '') }}
                                        </td>
                                    @endforeach
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                @endif
            </div>
        @endforeach
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
