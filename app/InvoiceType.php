<?php

namespace App\Enums;

enum InvoiceType: string
{
    case MEMBERSHIP = 'membership';
    case SUBSCRIPTION = 'subscription';
    case ROOMBOOKING = 'room_booking';
    case EVENTBOOKING = 'event_booking';
}

// ['invoice_type' => ['required', new Enum(InvoiceType::class)]]
