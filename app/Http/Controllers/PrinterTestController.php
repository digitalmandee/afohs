<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Mike42\Escpos\PrintConnectors\NetworkPrintConnector;
use Mike42\Escpos\Printer;

class PrinterTestController extends Controller
{
    public function index()
    {
        return Inertia::render('App/Settings/PrinterTest');
    }

    public function testPrint(Request $request)
    {
        $request->validate([
            'printer_ip' => 'required|ip',
            'printer_port' => 'nullable|integer|min:1|max:65535',
        ]);

        $ip = $request->printer_ip;
        $port = $request->printer_port ?? 9100;

        try {
            $connector = new NetworkPrintConnector($ip, $port, 5);
            $printer = new Printer($connector);

            // Print Test Receipt
            $printer->setJustification(Printer::JUSTIFY_CENTER);
            $printer->setTextSize(2, 2);
            $printer->text("PRINTER TEST\n");
            $printer->setTextSize(1, 1);
            $printer->text("================================\n");
            $printer->setJustification(Printer::JUSTIFY_LEFT);
            $printer->text("IP: {$ip}\n");
            $printer->text("Port: {$port}\n");
            $printer->text('Date: ' . now()->format('Y-m-d H:i:s') . "\n");
            $printer->text("================================\n");
            $printer->setJustification(Printer::JUSTIFY_CENTER);
            $printer->text("Connection Successful!\n");
            $printer->text("AFOHS Club POS System\n");
            $printer->feed(3);
            $printer->cut();
            $printer->close();

            return response()->json([
                'success' => true,
                'message' => 'Test print sent successfully! Check the printer.',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to connect: ' . $e->getMessage(),
            ], 500);
        }
    }
}
