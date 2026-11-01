<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Animal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReminderController extends Controller
{
    public function index(Request $request, int $animal): JsonResponse
    {
        $model = $this->ownedAnimal($request, $animal);

        return response()->json([
            'data' => $model->reminders()->orderBy('reminder_date')->get(),
        ]);
    }

    public function store(Request $request, int $animal): JsonResponse
    {
        $model = $this->ownedAnimal($request, $animal);
        $reminder = $model->reminders()->create($request->validate($this->rules()));

        return response()->json(['data' => $reminder], 201);
    }

    public function update(Request $request, int $animal, int $reminder): JsonResponse
    {
        $model = $this->ownedAnimal($request, $animal);
        $record = $model->reminders()->findOrFail($reminder);
        $record->update($request->validate($this->rules(updating: true)));

        return response()->json(['data' => $record->refresh()]);
    }

    public function destroy(Request $request, int $animal, int $reminder): JsonResponse
    {
        $this->ownedAnimal($request, $animal)
            ->reminders()
            ->findOrFail($reminder)
            ->delete();

        return response()->json([], 204);
    }

    private function ownedAnimal(Request $request, int $id): Animal
    {
        return $request->user()->animals()->findOrFail($id);
    }

    private function rules(bool $updating = false): array
    {
        $required = $updating ? 'sometimes|required' : 'required';

        return [
            'title' => [$required, 'string', 'max:150'],
            'reminder_date' => [$required, 'date'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
        ];
    }
}
