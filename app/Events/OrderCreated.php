<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class OrderCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $order;
    /**
     * Create a new event instance.
     */
    public function __construct($order)
    {
        $this->order = $order;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn()
    {
        return new Channel('orders');
    }

    public function broadcastAs()
    {
        return 'order.created';
    }

    public function broadcastWith()
    {
        return [
            'id' => $this->order->id,
            'order_number' => $this->order->order_number,
            'user_id' => $this->order->user_id,
            'table_id' => $this->order->table_id,
            'order_type' => $this->order->order_type,
            'person_count' => $this->order->person_count,
            'amount' => $this->order->amount,
            'down_payment' => $this->order->down_payment,
            'status' => $this->order->status,
            'order_time' => $this->order->order_time,
            'kitchen_note' => $this->order->kitchen_note,
            'staff_note' => $this->order->staff_note,
            // 'waiter' => $this->order->waiter ? $this->order->waiter->name : null,
            'table' => $this->order->table ? $this->order->table : null,
            'order_items' => $this->order->orderItems,
            'created_at' => $this->order->created_at,
        ];
    }
}