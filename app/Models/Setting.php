<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends BaseModel
{
    use HasFactory;

    protected $fillable = ['type', 'value'];
    protected $casts = ['value' => 'array'];

    public static function getGroup(string $type): array
    {
        return self::where('type', $type)->first()?->value ?? [];
    }

    public static function updateGroup(string $type, array $data): void
    {
        self::updateOrCreate(['type' => $type], ['value' => $data]);
    }
}