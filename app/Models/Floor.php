<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Floor extends Model
{
    protected $fillable = ['name', 'area', 'status', 'tenant_id', 'location_id'];

    public function tables()
    {
        return $this->hasMany(Table::class);
    }
}
