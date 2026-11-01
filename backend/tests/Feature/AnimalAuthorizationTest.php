<?php

namespace Tests\Feature;

use App\Models\LivestockType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AnimalAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_livestock_types_are_available_for_animal_forms(): void
    {
        $this->actingAs(User::factory()->create())
            ->getJson('/api/livestock-types')
            ->assertOk()
            ->assertJsonCount(4, 'data')
            ->assertJsonFragment(['name' => 'Bovin'])
            ->assertJsonFragment(['name' => 'Équin'])
            ->assertJsonFragment(['name' => 'Porcin'])
            ->assertJsonFragment(['name' => 'Caprin']);
    }

    public function test_user_cannot_view_another_users_animal(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $type = LivestockType::query()->firstOrCreate(['name' => 'Bovin']);
        $animal = $owner->animals()->create([
            'livestock_type_id' => $type->id,
            'name' => 'Belle',
        ]);

        $this->actingAs($otherUser)
            ->getJson("/api/animals/{$animal->id}")
            ->assertNotFound();
    }

    public function test_admin_cannot_access_animal_management(): void
    {
        $admin = User::factory()->create(['profile_type' => 'admin']);

        $this->actingAs($admin)
            ->getJson('/api/animals')
            ->assertForbidden();
    }

    public function test_animal_tag_number_is_unique(): void
    {
        $user = User::factory()->create();
        $type = LivestockType::query()->firstOrCreate(['name' => 'Bovin']);
        $user->animals()->create([
            'livestock_type_id' => $type->id,
            'tag_number' => 'FR1234567890',
            'name' => 'Belle',
        ]);

        $this->actingAs($user)->postJson('/api/animals', [
            'livestock_type_id' => $type->id,
            'tag_number' => 'FR1234567890',
            'name' => 'Brune',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('tag_number');
    }

    public function test_an_animal_cannot_be_its_own_parent(): void
    {
        $user = User::factory()->create();
        $type = LivestockType::query()->firstOrCreate(['name' => 'Bovin']);
        $animal = $user->animals()->create([
            'livestock_type_id' => $type->id,
            'name' => 'Belle',
        ]);

        $this->actingAs($user)
            ->patchJson("/api/animals/{$animal->id}", [
                'parent_animal_id' => $animal->id,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('parent_animal_id');
    }

    public function test_animal_can_have_one_housing_type(): void
    {
        $user = User::factory()->create();
        $type = LivestockType::query()->firstOrCreate(['name' => 'Bovin']);

        $response = $this->actingAs($user)->postJson('/api/animals', [
            'livestock_type_id' => $type->id,
            'name' => 'Belle',
            'housing_type' => 'plein_air',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.housing_type', 'plein_air');
    }

    public function test_animal_housing_type_only_accepts_a_single_supported_value(): void
    {
        $user = User::factory()->create();
        $type = LivestockType::query()->firstOrCreate(['name' => 'Bovin']);

        $this->actingAs($user)->postJson('/api/animals', [
            'livestock_type_id' => $type->id,
            'name' => 'Belle',
            'housing_type' => 'mixte',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('housing_type');
    }
}
