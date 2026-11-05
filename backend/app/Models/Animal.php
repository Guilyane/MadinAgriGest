<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'exploitation_id',
    'livestock_type_id',
    'parent_animal_id',
    'mother_animal_id',
    'father_animal_id',
    'tag_number',
    'housing_type',
    'name',
    'breed',
    'sex',
    'birth_date',
    'status',
    'comments',
])]
class Animal extends Model
{
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }

    public function exploitation(): BelongsTo
    {
        return $this->belongsTo(Exploitation::class);
    }

    public function livestockType(): BelongsTo
    {
        return $this->belongsTo(LivestockType::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Animal::class, 'parent_animal_id');
    }

    public function mother(): BelongsTo
    {
        return $this->belongsTo(Animal::class, 'mother_animal_id');
    }

    public function father(): BelongsTo
    {
        return $this->belongsTo(Animal::class, 'father_animal_id');
    }

    public function healthRecords(): HasMany
    {
        return $this->hasMany(HealthRecord::class);
    }

    public function reminders(): HasMany
    {
        return $this->hasMany(Reminder::class);
    }
}
