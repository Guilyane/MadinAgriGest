<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            if (! Schema::hasColumn('users', 'first_name')) {
                $table->string('first_name', 100)->default('');
            }
            if (! Schema::hasColumn('users', 'last_name')) {
                $table->string('last_name', 100)->default('');
            }
            if (! Schema::hasColumn('users', 'profile_type')) {
                $table->string('profile_type', 20)->default('particulier');
            }
        });

        if (Schema::hasColumn('users', 'name')) {
            DB::table('users')
                ->where('first_name', '')
                ->orderBy('id')
                ->chunkById(100, function ($users): void {
                    foreach ($users as $user) {
                        $nameParts = preg_split('/\s+/', trim($user->name), 2, PREG_SPLIT_NO_EMPTY) ?: [];

                        DB::table('users')
                            ->where('id', $user->id)
                            ->update([
                                'first_name' => $nameParts[0] ?? '',
                                'last_name' => $nameParts[1] ?? '',
                            ]);
                    }
                });
        }

        if (! Schema::hasIndex('users', ['id', 'profile_type'], 'unique')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->unique(['id', 'profile_type']);
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasIndex('users', ['id', 'profile_type'], 'unique')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->dropUnique(['id', 'profile_type']);
            });
        }

        Schema::table('users', function (Blueprint $table): void {
            foreach (['first_name', 'last_name', 'profile_type'] as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
