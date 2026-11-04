<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_as_a_particular_or_breeder(): void
    {
        Schema::table('users', function ($table): void {
            $table->string('name');
        });

        $response = $this->withHeader('Origin', 'http://localhost')
            ->postJson('/api/auth/register', [
                'first_name' => 'Aline',
                'last_name' => 'Martin',
                'email' => 'aline@example.test',
                'password' => 'password123',
                'password_confirmation' => 'password123',
                'profile_type' => 'eleveur',
                'siret' => '12345678901234',
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.profile_type', 'eleveur')
            ->assertJsonMissingPath('data.password');

        $this->assertDatabaseHas('users', [
            'email' => 'aline@example.test',
            'name' => 'Aline Martin',
            'profile_type' => 'eleveur',
            'siret' => '12345678901234',
        ]);
    }

    public function test_breeder_registration_requires_a_valid_siret(): void
    {
        $registration = [
            'first_name' => 'Aline',
            'last_name' => 'Martin',
            'email' => 'aline@example.test',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'profile_type' => 'eleveur',
        ];

        $this->withHeader('Origin', 'http://localhost')
            ->postJson('/api/auth/register', $registration)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('siret');

        $this->withHeader('Origin', 'http://localhost')
            ->postJson('/api/auth/register', [...$registration, 'siret' => '1234567890123A'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('siret');

        $this->assertSame(0, User::query()->count());
    }

    public function test_particular_registration_does_not_require_a_siret(): void
    {
        $this->withHeader('Origin', 'http://localhost')
            ->postJson('/api/auth/register', [
                'first_name' => 'Aline',
                'last_name' => 'Martin',
                'email' => 'aline@example.test',
                'password' => 'password123',
                'password_confirmation' => 'password123',
                'profile_type' => 'particulier',
                'siret' => '123',
            ])
            ->assertCreated()
            ->assertJsonPath('data.profile_type', 'particulier');

        $this->assertDatabaseHas('users', [
            'email' => 'aline@example.test',
            'siret' => null,
        ]);
    }

    public function test_public_registration_cannot_create_an_admin(): void
    {
        $this->withHeader('Origin', 'http://localhost')
            ->postJson('/api/auth/register', [
                'first_name' => 'Admin',
                'last_name' => 'Account',
                'email' => 'admin@example.test',
                'password' => 'password123',
                'password_confirmation' => 'password123',
                'profile_type' => 'admin',
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('profile_type');

        $this->assertSame(0, User::query()->count());
    }

    public function test_user_can_update_profile_without_changing_their_role(): void
    {
        $user = User::factory()->create(['profile_type' => 'eleveur']);

        $this->actingAs($user)->patchJson('/api/auth/me', [
            'first_name' => 'Aline',
        ])->assertOk()
            ->assertJsonPath('data.first_name', 'Aline')
            ->assertJsonPath('data.profile_type', 'eleveur');
    }

    public function test_user_can_log_in_and_log_out_with_a_stateful_session(): void
    {
        $user = User::factory()->create();

        $this->withHeader('Origin', 'http://localhost')
            ->postJson('/api/auth/login', [
                'email' => $user->email,
                'password' => 'password',
            ])
            ->assertOk()
            ->assertJsonPath('data.id', $user->id);

        $this->postJson('/api/auth/logout')->assertNoContent();
        $this->getJson('/api/auth/me')->assertUnauthorized();
    }
}
