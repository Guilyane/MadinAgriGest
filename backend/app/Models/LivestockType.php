<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LivestockType extends Model
{
    protected $fillable = ['name'];

    public function animals(): HasMany
    {
        return $this->hasMany(Animal::class);
    }
}
