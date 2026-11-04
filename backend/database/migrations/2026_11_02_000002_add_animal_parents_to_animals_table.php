<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('animals', function (Blueprint $table): void {
            $table->unsignedBigInteger('mother_animal_id')->nullable();
            $table->unsignedBigInteger('father_animal_id')->nullable();
            $table->foreign(['mother_animal_id', 'owner_user_id'])
                ->references(['id', 'owner_user_id'])
                ->on('animals')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign(['father_animal_id', 'owner_user_id'])
                ->references(['id', 'owner_user_id'])
                ->on('animals')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });

        DB::table('animals as child')
            ->join('animals as parent', 'parent.id', '=', 'child.parent_animal_id')
            ->whereNotNull('child.parent_animal_id')
            ->whereIn('parent.sex', ['femelle', 'male'])
            ->select(['child.id as child_id', 'child.parent_animal_id', 'parent.sex'])
            ->orderBy('child.id')
            ->chunk(100, function ($animals): void {
                foreach ($animals as $animal) {
                    $parentField = $animal->sex === 'femelle' ? 'mother_animal_id' : 'father_animal_id';
                    DB::table('animals')
                        ->where('id', $animal->child_id)
                        ->update([$parentField => $animal->parent_animal_id]);
                }
            });
    }

    public function down(): void
    {
        Schema::table('animals', function (Blueprint $table): void {
            $table->dropForeign(['mother_animal_id', 'owner_user_id']);
            $table->dropForeign(['father_animal_id', 'owner_user_id']);
            $table->dropColumn(['mother_animal_id', 'father_animal_id']);
        });
    }
};
