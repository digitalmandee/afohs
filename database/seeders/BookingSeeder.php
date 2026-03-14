<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BookingSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('bookings')->insert([
            // Room Booking Example
            [
                'booking_id'    => Str::uuid(),
                'user_id'       => '1',
                'booking_type'  => 'room',
                'booking_For'   => 'main_guest',
                'type_id'       => 'R1001',
                'persons'       => '2',
                'total_rooms'   => '1',
                'checkin'       => now()->format('Y-m-d'),
                'checkout'      => now()->addDays(2)->format('Y-m-d'),
                'event_name'    => null,
                'start_time'    => null,
                'end_time'      => null,
                'total_payment' => 3000,
                'status'        => 'confirmed',
                'created_at'    => now(),
                'updated_at'    => now(),
            ],

            // Event Booking Example
            [
                'booking_id'    => Str::uuid(),
                'user_id'       => '2',
                'booking_type'  => 'event',
                'booking_For'   => 'other',
                'type_id'       => 'E202',
                'persons'       => null,
                'total_rooms'   => null,
                'checkin'       => now()->format('Y-m-d'),
                'checkout'      => null,
                'event_name'    => 'Annual Meetup',
                'start_time'    => '10:00:00',
                'end_time'      => '14:00:00',
                'total_payment' => 15000,
                'status'        => 'pending',
                'created_at'    => now(),
                'updated_at'    => now(),
            ],
        ]);
    }
}
