<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('health_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('animal_id')->constrained()->restrictOnDelete();
            $table->string('category', 20);
            $table->date('performed_on');
            $table->text('description');
            $table->timestamps();

            $table->index(['animal_id', 'performed_on']);
        });

        Schema::create('reminders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('animal_id')->constrained()->restrictOnDelete();
            $table->string('title', 150);
            $table->date('reminder_date');
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index(['animal_id', 'reminder_date']);
            $table->index('reminder_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reminders');
        Schema::dropIfExists('health_records');
    }
};
