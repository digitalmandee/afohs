<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Invoice Reminder</title>
    <style>
        body {
            margin: 0;
            font-family: 'Helvetica Neue', Arial, sans-serif;
            color: #555;
            background: #f5f5f5;
        }

        .container {
            max-width: 600px;
            margin: 30px auto;
            background: #ffffff;
            padding: 30px;
            border-radius: 20px;
            box-shadow: 0 0 15px -5px #000;
        }

        .container h1 {
            color: #ff9800;
            margin-bottom: 20px;
            font-size: 24px;
        }

        .container p {
            font-size: 16px;
            color: #666;
            margin-bottom: 10px;
        }

        .container .details {
            margin-bottom: 30px;
            padding: 20px;
            background: #fff3cc;
            border-radius: 10px;
        }

        .container .details p {
            margin-bottom: 5px;
            color: #ff9800;
            font-weight: bold;
        }

        .container a {
            display: inline-block;
            margin-top: 20px;
            padding: 12px 24px;
            background: #ff9800;
            color: #ffffff;
            text-decoration: none;
            border-radius: 30px;
            font-weight: bold;
            box-shadow: 0px 4px 12px -4px #ff9800;
            transition: all 0.3s ease;
        }

        .container a:hover {
            background: #ff8500;
            transform: translateY(-2px);
            box-shadow: 0px 6px 18px -6px #ff9800;
        }
    </style>
</head>

<body>
    <div class="container">
        <h1>Invoice Due Reminder</h1>
        <p>Dear {{ $subscription->user->first_name }},</p>

        <p>This is a friendly reminder that your Invoice <strong>{{ $data['invoice']['invoice_no'] }}</strong> is
            currently <strong>unpaid</strong> and due on
            <strong>{{ \Carbon\Carbon::parse($data['invoice']['due_date'])->format('F j, Y') }}</strong>.
        </p>

        <div class="details">
            <p>Subscription Type: {{ $data['subscription_type'] }}</p>
            <p>Category: {{ $data['category'] }}</p>
            <p>Invoice Amount: ${{ number_format($data['invoice']['total_price'], 2) }}</p>
            <p>Due Date: {{ \Carbon\Carbon::parse($data['invoice']['due_date'])->format('F j, Y') }}</p>
        </div>

        {{-- <a href="{{ route('invoices.show', $data['invoice']->id) }}">View Invoice</a> --}}

        <p>If you have already made the payment, please ignore this email. Otherwise, please clear your dues at the
            earliest.</p>

        <p>Thank you for choosing us!</p>
    </div>
</body>

</html>
