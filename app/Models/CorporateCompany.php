<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class CorporateCompany extends BaseModel
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['name', 'status'];
}
