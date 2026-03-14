<?php

namespace Database\Seeders;

use App\Models\TransactionType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TransactionTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $types = [
            [
                'id' => 1,
                'name' => 'Room Booking',
                'type' => 1,
                'status' => 'active',
                'table_name' => 'room_booking',
                'details' => 'roomInvoice',
                'account' => '810109',
                'cashrec_due' => '2019-01-01',
            ],
            [
                'id' => 2,
                'name' => 'Events Management',
                'type' => 2,
                'status' => 'active',
                'table_name' => 'event_booking',
                'details' => 'eventInvoice',
                'account' => '810112',
                'cashrec_due' => '2019-01-01',
            ],
            [
                'id' => 3,
                'name' => 'Membership Fee',
                'type' => 3,
                'status' => 'active',
                'table_name' => 'finance_invoice',
                'details' => 'financeInvoice',
                'account' => '495000',
                'cashrec_due' => '2019-01-01',
            ],
            [
                'id' => 4,
                'name' => 'Monthly Maintenance Fee',
                'type' => 4,
                'status' => 'active',
                'table_name' => 'finance_invoice',
                'details' => 'financeInvoice',
                'account' => '810110',
                'cashrec_due' => '2019-01-01',
            ],
            [
                'id' => 5,
                'name' => 'Subscription Fee',
                'type' => 5,
                'status' => 'active',
                'table_name' => 'finance_invoice',
                'details' => 'financeInvoice',
                'account' => null,
                'cashrec_due' => null,
            ],
            [
                'id' => 6,
                'name' => 'Charges Fee',
                'type' => 6,
                'status' => 'active',
                'table_name' => 'finance_invoice',
                'details' => 'financeInvoice',
                'account' => null,
                'cashrec_due' => null,
            ],
            [
                'id' => 7,
                'name' => 'Food Order Fee',
                'type' => 7,
                'status' => 'active',
                'table_name' => 'orders',
                'details' => 'orders',
                'account' => null,
                'cashrec_due' => null,
            ],
            [
                'id' => 8,
                'name' => 'Applied Member Fee',
                'type' => 8,  // TRANSACTION_TYPE_ID_APPLIED_MEMBER
                'status' => 'active',
                'table_name' => 'applied_member',
                'details' => 'appliedMember',
                'account' => null,
                'cashrec_due' => null,
            ],
        ];

        foreach ($types as $type) {
            TransactionType::updateOrCreate(
                ['id' => $type['id']],
                $type
            );
        }
    }
}
