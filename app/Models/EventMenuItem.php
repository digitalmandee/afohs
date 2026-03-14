<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EventMenuItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_menu_id',
        'menu_category_id',
        'amount',
        'status',
    ];

    /**
     * Get the event menu that owns the menu item.
     */
    public function eventMenu()
    {
        return $this->belongsTo(EventMenu::class, 'event_menu_id');
    }

    /**
     * Get the menu category that owns the menu item.
     */
    public function menuCategory()
    {
        return $this->belongsTo(EventMenuCategory::class, 'menu_category_id');
    }
}