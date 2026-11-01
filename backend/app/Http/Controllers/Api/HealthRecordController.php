<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Animal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class HealthRecordController extends Controller
{
    public function index(Request $request, int $animal): JsonResponse
    {
        $model = $this->ownedAnimal($request, $animal);

        return response()->json([
            'data' => $model->healthRecords()->orderByDesc('performed_on')->get(),
        ]);
    }

    public function store(Request $request, int $animal): JsonResponse
    {
        $model = $this->ownedAnimal($request, $animal);
        $record = $model->healthRecords()->create($request->validate($this->rules()));

        return response()->json(['data' => $record], 201);
    }

    public function update(Request $request, int $animal, int $healthRecord): JsonResponse
    {
        $model = $this->ownedAnimal($request, $animal);
        $record = $model->healthRecords()->findOrFail($healthRecord);
        $record->update($request->validate($this->rules(updating: true)));

        return response()->json(['data' => $record->refresh()]);
    }

    public function destroy(Request $request, int $animal, int $healthRecord): JsonResponse
    {
        $this->ownedAnimal($request, $animal)
            ->healthRecords()
            ->findOrFail($healthRecord)
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
            'category' => [$required, Rule::in(['vaccination', 'traitement'])],
            'performed_on' => [$required, 'date', 'before_or_equal:today'],
            'description' => [$required, 'string', 'max:5000'],
        ];
    }
}
