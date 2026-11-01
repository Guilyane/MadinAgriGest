<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        DB::table('livestock_types')->insertOrIgnore(
            array_map(
                static fn (string $name): array => [
                    'name' => $name,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
                ['Bovin', 'Équin', 'Porcin', 'Caprin'],
            ),
        );
    }

};
