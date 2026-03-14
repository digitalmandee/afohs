<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasFactory, HasRoles, Notifiable, SoftDeletes;

    protected $guard_name = 'web';  // Default guard for super admin

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'name',
        'email',
        'member_type_id',
        'phone_number',
        'first_name',
        'middle_name',
        'last_name',
        'password',
        'parent_user_id',
        'tenant_id',
        'profile_photo',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    protected static function booted()
    {
        static::creating(function ($model) {
            if (auth()->check() && !$model->created_by) {
                $model->created_by = auth()->id();
            }
        });

        static::updating(function ($model) {
            if (auth()->check()) {
                $model->updated_by = auth()->id();
            }
        });

        static::deleting(function ($model) {
            if (auth()->check()) {
                $model->deleted_by = auth()->id();
            }
        });
    }

    /**
     * Get the member type associated with the user.
     */
    public function memberType()
    {
        return $this->belongsTo(MemberType::class);
    }

    public function member()
    {
        return $this->hasOne(Member::class);
    }

    public function employee()
    {
        return $this->hasOne(Employee::class);
    }

    /**
     * Get the user's detail.
     */
    public function userDetail()
    {
        return $this->hasOne(UserDetail::class);
    }

    /**
     * Get the kitchen detail.
     */
    public function familyMembers()
    {
        return $this->hasMany(User::class, 'parent_user_id');
    }

    public function statusHistories()
    {
        return $this->hasMany(MemberStatusHistory::class);
    }

    /**
     * Get the tenants (restaurants) this user is allowed to access for order punching.
     * Uses central database connection since user_tenant_access is in the main/central DB.
     */
    public function allowedTenants()
    {
        return $this
            ->belongsToMany(Tenant::class, 'user_tenant_access', 'user_id', 'tenant_id')
            ->using(\Illuminate\Database\Eloquent\Relations\Pivot::class);
    }

    /**
     * Get allowed tenant IDs from the central database (works in tenant context).
     */
    public function getAllowedTenantIds(): array
    {
        return \Illuminate\Support\Facades\DB::connection('mysql')
            ->table('user_tenant_access')
            ->where('user_id', $this->id)
            ->pluck('tenant_id')
            ->toArray();
    }

    public function getAccessibleTenants()
    {
        $this->load('employee:id,user_id,branch_id');

        $query = Tenant::query()->select('id', 'name', 'branch_id', 'status');

        if ($this->hasRole('super-admin')) {
            return $query->get();
        }

        $query->where('status', 'active');

        $allowedTenantIds = $this->getAllowedTenantIds();
        $branchId = $this->employee?->branch_id;


        if ($branchId) {
            $tenantsByCompany = (clone $query)->where('branch_id', $branchId)->get();

            if ($tenantsByCompany->isNotEmpty()) {
                return $tenantsByCompany;
            }

            return $query->where('id', $branchId)->get();
        }

        if (empty($allowedTenantIds)) {
            return $query->whereRaw('1 = 0')->get();
        }

        return $query->whereIn('id', $allowedTenantIds)->get();
    }

    // Password is automatically hashed by the 'hashed' cast in $casts
    // No need for setPasswordAttribute mutator
}
