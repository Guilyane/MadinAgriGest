<?php

namespace Database\Seeders;

use App\Models\LivestockType;
use Illuminate\Database\Seeder;

class LivestockTypeSeeder extends Seeder
{
    public function run(): void
    {
        foreach (['Bovin', 'Porcin', 'Équin', 'Caprin'] as $name) {
            LivestockType::query()->firstOrCreate(['name' => $name]);
        }
    }
}
