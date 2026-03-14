<?php

namespace App\Jobs;

use App\Models\Order;
use App\Models\Tenant;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Mike42\Escpos\PrintConnectors\NetworkPrintConnector;
use Mike42\Escpos\Printer;

class PrintOrderJob implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $items;
    public $order;

    public function __construct($items, Order $order)
    {
        $this->items = $items;
        $this->order = $order;
    }

    public function handle()
    {
        $groupedByKitchen = $this->items;

        foreach ($groupedByKitchen as $kitchenId => $items) {
            $kitchen = Tenant::find($kitchenId);
            if (!$kitchen || !$kitchen->printer_ip)
                continue;

            try {
                $connector = new NetworkPrintConnector($kitchen->printer_ip, $kitchen->printer_port ?? 9100, 5);
                $printer = new Printer($connector);

                $printer->setJustification(Printer::JUSTIFY_CENTER);
                $printer->text("Kitchen: {$kitchen->name}\n");
                $printer->text("Order #: {$this->order->id}\n");
                $printer->text("Table: {$this->order->table->table_no}\n");
                $printer->text(date('Y-m-d H:i:s') . "\n");
                $printer->text("--------------------------------\n");

                foreach ($items as $item) {
                    $printer->text($item['name'] . ' x ' . $item['quantity'] . "\n");
                }

                $printer->feed(1);
                $printer->cut();
                $printer->close();
            } catch (\Throwable $th) {
                Log::error("Printer error for Kitchen {$kitchenId}: " . $th->getMessage());
            }
        }
    }
}
