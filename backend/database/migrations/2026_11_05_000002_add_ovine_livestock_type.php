<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        DB::table('livestock_types')->insertOrIgnore([
            'name' => 'Ovin',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }

    public function down(): void
    {
        DB::table('livestock_types')
            ->where('name', 'Ovin')
            ->delete();
    }
};
