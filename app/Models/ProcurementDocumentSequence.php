<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProcurementDocumentSequence extends Model
{
    protected $fillable = [
        'branch_id',
        'document_type',
        'period_ym',
        'last_number',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}

