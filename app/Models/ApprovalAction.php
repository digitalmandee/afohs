<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApprovalAction extends Model
{
    protected $fillable = [
        'workflow_id',
        'workflow_step_id',
        'document_type',
        'document_id',
        'action',
        'remarks',
        'action_by',
    ];
}
