<?php

use App\Http\Controllers\Api\AnimalController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ExploitationController;
use App\Http\Controllers\Api\HealthRecordController;
use App\Http\Controllers\Api\ReminderController;
use App\Models\LivestockType;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function (): void {
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:6,1');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:6,1');

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('/me', [AuthController::class, 'me']);
        Route::patch('/me', [AuthController::class, 'updateProfile']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

Route::middleware(['auth:sanctum', 'can:manage-animals'])->group(function (): void {
    Route::get('/dashboard', DashboardController::class);
    Route::get('/livestock-types', fn () => response()->json([
        'data' => LivestockType::query()->orderBy('name')->get(['id', 'name']),
    ]));

    Route::get('/animal-parent-options', [AnimalController::class, 'parentOptions']);
    Route::apiResource('animals', AnimalController::class);

    Route::get('/animals/{animal}/health-records', [HealthRecordController::class, 'index']);
    Route::post('/animals/{animal}/health-records', [HealthRecordController::class, 'store']);
    Route::put('/animals/{animal}/health-records/{healthRecord}', [HealthRecordController::class, 'update']);
    Route::patch('/animals/{animal}/health-records/{healthRecord}', [HealthRecordController::class, 'update']);
    Route::delete('/animals/{animal}/health-records/{healthRecord}', [HealthRecordController::class, 'destroy']);

    Route::get('/animals/{animal}/reminders', [ReminderController::class, 'index']);
    Route::post('/animals/{animal}/reminders', [ReminderController::class, 'store']);
    Route::put('/animals/{animal}/reminders/{reminder}', [ReminderController::class, 'update']);
    Route::patch('/animals/{animal}/reminders/{reminder}', [ReminderController::class, 'update']);
    Route::delete('/animals/{animal}/reminders/{reminder}', [ReminderController::class, 'destroy']);

    Route::middleware('can:manage-exploitations')->apiResource(
        'exploitations',
        ExploitationController::class,
    );
});
