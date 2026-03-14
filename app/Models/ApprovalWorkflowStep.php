<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApprovalWorkflowStep extends Model
{
    protected $fillable = [
        'workflow_id',
        'step_order',
        'name',
        'role_name',
        'min_approvers',
        'conditions',
    ];

    protected $casts = [
        'conditions' => 'array',
    ];

    public function workflow()
    {
        return $this->belongsTo(ApprovalWorkflow::class, 'workflow_id');
    }
}

