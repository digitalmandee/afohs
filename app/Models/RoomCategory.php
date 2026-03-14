<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class RoomCategory extends BaseModel
{
    use SoftDeletes;

    protected $fillable = ['name', 'status', 'created_by', 'updated_by', 'deleted_by'];
}
