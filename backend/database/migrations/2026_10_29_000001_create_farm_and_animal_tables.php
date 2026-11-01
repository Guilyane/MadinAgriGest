<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exploitations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_user_id');
            $table->string('owner_profile_type', 20)->default('eleveur');
            $table->string('name', 150);
            $table->string('location')->nullable();
            $table->timestamps();

            $table->unique(['id', 'owner_user_id']);
            $table->index('owner_user_id');
            $table->foreign(['owner_user_id', 'owner_profile_type'])
                ->references(['id', 'profile_type'])
                ->on('users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });

        if (DB::getDriverName() === 'sqlite') {
            DB::statement(<<<'SQL'
                CREATE TRIGGER chk_exploitations_owner_role_insert
                BEFORE INSERT ON exploitations
                WHEN NEW.owner_profile_type <> 'eleveur'
                BEGIN
                    SELECT RAISE(ABORT, 'Only breeders can own exploitations');
                END
            SQL);
            DB::statement(<<<'SQL'
                CREATE TRIGGER chk_exploitations_owner_role_update
                BEFORE UPDATE OF owner_profile_type ON exploitations
                WHEN NEW.owner_profile_type <> 'eleveur'
                BEGIN
                    SELECT RAISE(ABORT, 'Only breeders can own exploitations');
                END
            SQL);
        } else {
            DB::statement(
                "ALTER TABLE exploitations ADD CONSTRAINT chk_exploitations_owner_role CHECK (owner_profile_type = 'eleveur')",
            );
        }

        Schema::create('livestock_types', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique();
            $table->timestamps();
        });

        Schema::create('animals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_user_id')->constrained('users')->restrictOnDelete();
            $table->unsignedBigInteger('exploitation_id')->nullable();
            $table->foreignId('livestock_type_id')
                ->constrained('livestock_types')
                ->restrictOnDelete();
            $table->unsignedBigInteger('parent_animal_id')->nullable();
            $table->string('tag_number', 100)->nullable()->unique();
            $table->string('name', 100);
            $table->string('sex', 20)->nullable();
            $table->date('birth_date')->nullable();
            $table->string('status', 20)->default('actif');
            $table->string('comments', 500)->nullable();
            $table->timestamps();

            $table->unique(['id', 'owner_user_id']);
            $table->index(['owner_user_id', 'status']);
            $table->foreign(['exploitation_id', 'owner_user_id'])
                ->references(['id', 'owner_user_id'])
                ->on('exploitations')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreign(['parent_animal_id', 'owner_user_id'])
                ->references(['id', 'owner_user_id'])
                ->on('animals')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });

        if (DB::getDriverName() === 'sqlite') {
            DB::statement(<<<'SQL'
                CREATE TRIGGER chk_animals_not_own_parent_insert
                BEFORE INSERT ON animals
                WHEN NEW.parent_animal_id = NEW.id
                BEGIN
                    SELECT RAISE(ABORT, 'An animal cannot be its own parent');
                END
            SQL);
            DB::statement(<<<'SQL'
                CREATE TRIGGER chk_animals_not_own_parent_update
                BEFORE UPDATE OF parent_animal_id ON animals
                WHEN NEW.parent_animal_id = NEW.id
                BEGIN
                    SELECT RAISE(ABORT, 'An animal cannot be its own parent');
                END
            SQL);
        } else {
            DB::statement(
                'ALTER TABLE animals ADD CONSTRAINT chk_animals_not_own_parent CHECK (parent_animal_id IS NULL OR parent_animal_id <> id)',
            );
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('animals');
        Schema::dropIfExists('livestock_types');
        Schema::dropIfExists('exploitations');

        if (DB::getDriverName() === 'sqlite') {
            DB::statement('DROP TRIGGER IF EXISTS chk_exploitations_owner_role_insert');
            DB::statement('DROP TRIGGER IF EXISTS chk_exploitations_owner_role_update');
            DB::statement('DROP TRIGGER IF EXISTS chk_animals_not_own_parent_insert');
            DB::statement('DROP TRIGGER IF EXISTS chk_animals_not_own_parent_update');
        }
    }
};
