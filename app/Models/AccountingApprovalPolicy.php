<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccountingApprovalPolicy extends Model
{
    protected $fillable = [
        'module',
        'is_active',
        'enforce_maker_checker',
        'approver_role',
        'level1_role',
        'level1_max_amount',
        'level2_role',
        'sla_hours',
        'escalation_role',
        'auto_post_below',
        'updated_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'enforce_maker_checker' => 'boolean',
        'level1_max_amount' => 'decimal:2',
        'sla_hours' => 'integer',
        'auto_post_below' => 'decimal:2',
    ];
}
