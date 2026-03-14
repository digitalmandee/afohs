<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard Report - {{ $month }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background: #fff;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #063455;
            padding-bottom: 20px;
        }

        .header h1 {
            color: #063455;
            font-size: 28px;
            margin-bottom: 10px;
        }

        .header p {
            color: #666;
            font-size: 14px;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }

        .stat-card {
            background: #f8f9fa;
            border: 2px solid #063455;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        }

        .stat-card h3 {
            color: #063455;
            font-size: 16px;
            margin-bottom: 10px;
            font-weight: 600;
        }

        .stat-card .value {
            color: #063455;
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .stat-card .label {
            color: #666;
            font-size: 12px;
        }

        .revenue-section {
            background: #063455;
            color: white;
            padding: 30px;
            border-radius: 8px;
            margin-bottom: 30px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
        }

        .revenue-item h3 {
            font-size: 14px;
            margin-bottom: 10px;
            opacity: 0.9;
        }

        .revenue-item .amount {
            font-size: 36px;
            font-weight: bold;
        }

        .chart-section {
            margin-top: 30px;
            page-break-before: always;
            page-break-inside: avoid;
        }

        .chart-section h2 {
            color: #063455;
            font-size: 20px;
            margin-bottom: 20px;
            border-bottom: 2px solid #063455;
            padding-bottom: 10px;
        }

        .page-break {
            page-break-after: always;
        }

        .chart-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }

        .chart-table th {
            background: #063455;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
        }

        .chart-table td {
            padding: 10px 12px;
            border-bottom: 1px solid #ddd;
        }

        .chart-table tr:nth-child(even) {
            background: #f8f9fa;
        }

        .footer {
            margin-top: 40px;
            text-align: center;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #ddd;
            padding-top: 20px;
        }

        @media print {
            body {
                padding: 0;
            }

            .stat-card {
                page-break-inside: avoid;
            }

            .revenue-section {
                page-break-inside: avoid;
            }

            .chart-section {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>AFOHS Club Dashboard Report</h1>
        <p>Period: {{ $month }} | Year: {{ $year }}</p>
        <p>Generated on: {{ now()->format('d M Y, h:i A') }}</p>
    </div>

    <!-- Revenue & Profit Section -->
    <div class="revenue-section">
        <div class="revenue-item">
            <h3>Total Revenue</h3>
            <div class="amount">Rs {{ number_format($stats['totalRevenue'], 2) }}</div>
        </div>
        <div class="revenue-item">
            <h3>Total Profit</h3>
            <div class="amount">Rs {{ number_format($stats['totalProfit'], 2) }}</div>
        </div>
    </div>

    <!-- Statistics Grid -->
    <div class="stats-grid">
        <div class="stat-card">
            <h3>Total Bookings</h3>
            <div class="value">{{ $stats['totalBookings'] }}</div>
            <div class="label">Room: {{ $stats['totalRoomBookings'] }} | Event: {{ $stats['totalEventBookings'] }}</div>
        </div>

        <div class="stat-card">
            <h3>Total Members</h3>
            <div class="value">{{ $stats['totalMembers'] }}</div>
            <div class="label">Main Members</div>
        </div>

        <div class="stat-card">
            <h3>Total Customers</h3>
            <div class="value">{{ $stats['totalCustomers'] }}</div>
            <div class="label">All Customers</div>
        </div>

        <div class="stat-card">
            <h3>Total Employees</h3>
            <div class="value">{{ $stats['totalEmployees'] }}</div>
            <div class="label">Active Employees</div>
        </div>

        <div class="stat-card">
            <h3>Product Orders</h3>
            <div class="value">{{ $stats['totalProductOrders'] }}</div>
            <div class="label">This Period</div>
        </div>

        <div class="stat-card">
            <h3>Subscription Orders</h3>
            <div class="value">{{ $stats['totalSubscriptionOrders'] }}</div>
            <div class="label">This Period</div>
        </div>
    </div>

    <!-- Monthly Chart Data -->
    <div class="chart-section">
        <h2>Monthly Revenue Analysis - {{ $year }}</h2>
        <table class="chart-table">
            <thead>
                <tr>
                    <th>Month</th>
                    <th>Income</th>
                    <th>Expenses</th>
                    <th>Profit</th>
                </tr>
            </thead>
            <tbody>
                @foreach($chartData as $data)
                <tr>
                    <td><strong>{{ $data['name'] }}</strong></td>
                    <td>Rs {{ number_format($data['income'], 2) }}</td>
                    <td>Rs {{ number_format($data['expenses'], 2) }}</td>
                    <td style="color: {{ $data['profit'] >= 0 ? '#2ecc71' : '#e74c3c' }}; font-weight: bold;">
                        Rs {{ number_format($data['profit'], 2) }}
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <div class="footer">
        <p>&copy; {{ now()->year }} AFOHS Club. All rights reserved.</p>
        <p>This is a computer-generated report and does not require a signature.</p>
    </div>

    <script>
        // Auto print when page loads
        window.onload = function() {
            window.print();
        };
    </script>
</body>
</html>
