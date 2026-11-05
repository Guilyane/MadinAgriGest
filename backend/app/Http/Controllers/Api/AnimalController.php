<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Animal;
use App\Models\LivestockType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AnimalController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $animals = $request->user()->animals()
            ->with(['livestockType', 'exploitation'])
            ->orderBy('name')
            ->paginate(20);

        return response()->json($animals);
    }

    public function parentOptions(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $request->user()->animals()
                ->orderBy('name')
                ->get(['id', 'name', 'sex', 'tag_number']),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate($this->rules($request));
        $name = trim((string) ($validated['name'] ?? ''));

        if ($name === '') {
            $animal = DB::transaction(function () use ($request, $validated): Animal {
                $request->user()->newQuery()
                    ->whereKey($request->user()->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                $type = LivestockType::query()->findOrFail($validated['livestock_type_id']);
                $nextNumber = $request->user()->animals()
                    ->where('livestock_type_id', $type->id)
                    ->pluck('name')
                    ->reduce(function (int $nextNumber, string $existingName) use ($type): int {
                        if (preg_match('/^'.preg_quote($type->name, '/').' (\d+)$/u', $existingName, $matches)) {
                            return max($nextNumber, (int) $matches[1] + 1);
                        }

                        return $nextNumber;
                    }, 1);

                return $request->user()->animals()->create([
                    ...$validated,
                    'name' => "{$type->name} {$nextNumber}",
                ]);
            });
        } else {
            $animal = $request->user()->animals()->create($validated);
        }

        return response()->json([
            'data' => $animal->load(['livestockType', 'exploitation', 'parent', 'mother', 'father']),
        ], 201);
    }

    public function show(Request $request, int $animal): JsonResponse
    {
        return response()->json([
            'data' => $this->ownedAnimal($request, $animal)->load([
                'livestockType',
                'exploitation',
                'parent',
                'mother',
                'father',
                'healthRecords',
                'reminders',
            ]),
        ]);
    }

    public function update(Request $request, int $animal): JsonResponse
    {
        $model = $this->ownedAnimal($request, $animal);
        $model->update($request->validate($this->rules($request, updating: true)));

        return response()->json([
            'data' => $model->refresh()->load(['livestockType', 'exploitation', 'parent', 'mother', 'father']),
        ]);
    }

    public function destroy(Request $request, int $animal): JsonResponse
    {
        $model = $this->ownedAnimal($request, $animal);
        $model->update(['status' => 'archive']);

        return response()->json(['data' => $model->refresh()], 200);
    }

    private function ownedAnimal(Request $request, int $id): Animal
    {
        return $request->user()->animals()->findOrFail($id);
    }

    private function rules(Request $request, bool $updating = false): array
    {
        $required = $updating ? 'sometimes|required' : 'required';

        return [
            'exploitation_id' => [
                'sometimes',
                'nullable',
                Rule::exists('exploitations', 'id')
                    ->where('owner_user_id', $request->user()->id),
            ],
            'livestock_type_id' => [
                $required,
                'integer',
                Rule::exists('livestock_types', 'id'),
            ],
            'parent_animal_id' => [
                'sometimes',
                'nullable',
                Rule::notIn([$request->route('animal')]),
                Rule::exists('animals', 'id')
                    ->where('owner_user_id', $request->user()->id),
            ],
            'mother_animal_id' => [
                'sometimes',
                'nullable',
                Rule::notIn([$request->route('animal')]),
                Rule::exists('animals', 'id')
                    ->where('owner_user_id', $request->user()->id),
            ],
            'father_animal_id' => [
                'sometimes',
                'nullable',
                Rule::notIn([$request->route('animal')]),
                Rule::exists('animals', 'id')
                    ->where('owner_user_id', $request->user()->id),
            ],
            'tag_number' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
                Rule::unique('animals', 'tag_number')
                    ->ignore($request->route('animal')),
            ],
            'housing_type' => [
                'sometimes',
                'nullable',
                Rule::in(['plein_air', 'stabulation']),
            ],
            'name' => $updating
                ? ['sometimes', 'required', 'string', 'max:100']
                : ['sometimes', 'nullable', 'string', 'max:100'],
            'breed' => ['sometimes', 'nullable', 'string', 'max:100'],
            'sex' => ['sometimes', 'nullable', Rule::in(['femelle', 'male'])],
            'birth_date' => ['sometimes', 'nullable', 'date', 'before_or_equal:today'],
            'status' => ['sometimes', Rule::in(['actif', 'vendu', 'decede'])],
            'comments' => ['sometimes', 'nullable', 'string', 'max:500'],
        ];
    }
}
