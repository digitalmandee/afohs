<?php

namespace App\Models;

use App\Models\Product;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PosManufacturer extends Model
{
    use SoftDeletes;

    protected $fillable = ['tenant_id', 'location_id', 'name', 'status', 'created_by', 'updated_by', 'deleted_by'];

    public function products()
    {
        return $this->hasMany(Product::class, 'manufacturer_id');
    }
}
