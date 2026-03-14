<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class RoomChargesType extends BaseModel
{
    use SoftDeletes;

    protected $fillable = ['name', 'amount', 'status', 'created_by', 'updated_by', 'deleted_by'];
}
