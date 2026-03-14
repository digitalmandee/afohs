<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class EventMenuCategory extends BaseModel
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'status',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    /**
     * Get the menu items for the category.
     */
    public function menuItems()
    {
        return $this->hasMany(EventMenuItem::class, 'menu_category_id');
    }
}
