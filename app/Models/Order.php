<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends BaseModel
{
    use HasFactory, SoftDeletes;

    // protected $dates = ['order_time' => 'datetime:Y-m-d\TH:i:s\Z'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    protected $fillable = [
        'reservation_id',
        'member_id',
        'customer_id',
        'employee_id',
        'room_booking_id',
        'event_booking_id',
        'cashier_id',
        'waiter_id',
        'rider_id',
        'table_id',
        'order_type',
        'person_count',
        'down_payment',
        'nature_of_function',
        'theme_of_function',
        'special_request',
        'amount',
        'start_date',
        'start_time',
        'order_time',
        'end_time',
        'status',
        'remark',
        'instructions',
        'cancelType',
        'payment_status',
        'kitchen_note',
        'staff_note',
        'payment_note',
        'tax',
        'address',
        'discount',
        'total_price',
        'cost_price',
        'cash_amount',
        'credit_card_amount',
        'bank_amount',
        'paid_at',
        'paid_amount',
        'ent_reason',
        'ent_comment',
        'cts_comment',
        'credit_card_type',
        'payment_method',
        'reciept',
        'tenant_id',
        'location_id',
        'service_charges',
        'service_charges_percentage',
        'bank_charges',
        'bank_charges_percentage',
        'deducted_in_payslip_id',
        'deducted_at',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function table()
    {
        return $this->belongsTo(Table::class);
    }

    public function member()
    {
        return $this->belongsTo(Member::class, 'member_id', 'id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id', 'id');
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'id');
    }

    public function waiter()
    {
        return $this->belongsTo(Employee::class, 'waiter_id', 'id');
    }

    /**
     * Note: Order-Invoice relationship is via JSON column (data->order_id).
     * Use whereExists queries when filtering by invoice properties.
     * This relationship is for reference only and may not work with eager loading.
     */
    // public function invoices()
    // {
    //     return $this->hasMany(FinancialInvoice::class, 'id', 'id')
    //         ->whereRaw("JSON_EXTRACT(data, '$.order_id') = ?", [$this->id]);
    // }
    public function invoice()
    {
        // Ideally this should be a morphOne if we use invoiceable_id/type
        // But based on current controller logic, it seems to be using JSON or assumed link
        // Let's try to see if we can use a direct link if one exists, or fallback to a custom hasOne that might not work with standard 'with'
        // Actually, let's use the polymorphic relationship if the controller sets it.
        return $this->morphOne(FinancialInvoice::class, 'invoiceable');
    }

    public function cashier()
    {
        return $this->belongsTo(User::class, 'cashier_id', 'id');
    }

    public function rider()
    {
        return $this->belongsTo(Employee::class, 'rider_id', 'id');
    }

    public function deductedInPayslip()
    {
        return $this->belongsTo(Payslip::class, 'deducted_in_payslip_id');
    }

    public function roomBooking()
    {
        return $this->belongsTo(RoomBooking::class, 'room_booking_id');
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function printLogs()
    {
        return $this->hasMany(OrderPrintLog::class);
    }
}
