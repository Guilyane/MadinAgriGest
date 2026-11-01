<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reminder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $today = now()->toDateString();
        $ownerId = $request->user()->id;
        $reminders = Reminder::query()
            ->whereHas('animal', fn ($query) => $query->where('owner_user_id', $ownerId));
        $reminderData = fn (string $operator) => (clone $reminders)
            ->with('animal:id,name')
            ->whereDate('reminder_date', $operator, $today)
            ->orderBy('reminder_date')
            ->get();

        return response()->json([
            'data' => [
                'active_animals_count' => $request->user()->animals()
                    ->where('status', 'actif')
                    ->count(),
                'upcoming_reminders' => $reminderData('>='),
                'overdue_reminders' => $reminderData('<'),
            ],
        ]);
    }
}
