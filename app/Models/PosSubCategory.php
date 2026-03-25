<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PosSubCategory extends BaseModel
{
    use SoftDeletes;

    protected $fillable = ['tenant_id', 'location_id', 'category_id', 'name', 'status', 'created_by', 'updated_by', 'deleted_by'];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function products()
    {
        return $this->hasMany(Product::class, 'sub_category_id');
    }
}
