<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MemberStatusHistory extends BaseModel
{
    use HasFactory;

    protected $fillable = [
        'member_id',
        'status',
        'reason',
        'start_date',
        'end_date',
        'created_by',
        'updated_by',
        'deleted_by',
        'used_up_to',
        'changed_by',
        'changed_at',
        'corporate_member_id',
    ];

    public function member()
    {
        return $this->belongsTo(Member::class);
    }

    public function corporateMember()
    {
        return $this->belongsTo(CorporateMember::class);
    }
}
