<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ApiError, apiRequest } from '../api';
import { auth } from '../auth';
import AlertMessage from '../components/AlertMessage.vue';
import AppLayout from '../components/AppLayout.vue';
import FormField from '../components/FormField.vue';
import { t } from '../i18n';

const route = useRoute();
const router = useRouter();
const isEditing = computed(() => Boolean(route.params.id));
const loading = ref(isEditing.value);
const busy = ref(false);
const error = ref('');
const errors = ref({});
const types = ref([]);
const exploitations = ref([]);
const parentOptions = ref([]);
const form = ref({
    name: '',
    livestock_type_id: '',
    tag_number: '',
    sex: '',
    birth_date: '',
    mother_animal_id: '',
    father_animal_id: '',
    housing_type: '',
    exploitation_id: '',
    comments: '',
});

onMounted(async () => {
    try {
        const [typeResponse, parentResponse] = await Promise.all([
            apiRequest('/livestock-types'),
            apiRequest('/animal-parent-options'),
            loadOptionalData(),
            isEditing.value ? loadAnimal() : Promise.resolve(),
        ]);
        types.value = typeResponse.data;
        parentOptions.value = parentResponse.data;
    } catch (exception) {
        error.value = exception.message;
    } finally {
        loading.value = false;
    }
});

async function loadOptionalData() {
    if (auth.user?.profile_type === 'eleveur') {
        const response = await apiRequest('/exploitations');
        exploitations.value = response.data;
    }
}

async function loadAnimal() {
    const response = await apiRequest(`/animals/${route.params.id}`);
    const animal = response.data;
    form.value = {
        name: animal.name ?? '',
        livestock_type_id: String(animal.livestock_type_id ?? ''),
        tag_number: animal.tag_number ?? '',
        sex: animal.sex ?? '',
        birth_date: animal.birth_date?.slice(0, 10) ?? '',
        mother_animal_id: animal.mother_animal_id ? String(animal.mother_animal_id) : '',
        father_animal_id: animal.father_animal_id ? String(animal.father_animal_id) : '',
        housing_type: animal.housing_type ?? '',
        exploitation_id: animal.exploitation_id ? String(animal.exploitation_id) : '',
        comments: animal.comments ?? '',
    };
}

async function submit() {
    busy.value = true;
    error.value = '';
    errors.value = {};
    const payload = {
        ...form.value,
        livestock_type_id: Number(form.value.livestock_type_id),
        tag_number: form.value.tag_number || null,
        sex: form.value.sex || null,
        birth_date: form.value.birth_date || null,
        mother_animal_id: form.value.mother_animal_id ? Number(form.value.mother_animal_id) : null,
        father_animal_id: form.value.father_animal_id ? Number(form.value.father_animal_id) : null,
        housing_type: form.value.housing_type || null,
        exploitation_id: form.value.exploitation_id
            ? (form.value.exploitation_id.startsWith('offline-')
                ? form.value.exploitation_id
                : Number(form.value.exploitation_id))
            : null,
        comments: form.value.comments || null,
    };

    try {
        const response = await apiRequest(
            isEditing.value ? `/animals/${route.params.id}` : '/animals',
            { method: isEditing.value ? 'PUT' : 'POST', body: payload },
        );
        await router.push({ name: 'animal-detail', params: { id: response.data.id } });
    } catch (exception) {
        if (exception instanceof ApiError && exception.status === 422) {
            errors.value = Object.fromEntries(
                Object.entries(exception.errors).map(([field, messages]) => [field, messages[0]]),
            );
        } else {
            error.value = exception.message;
        }
    } finally {
        busy.value = false;
    }
}
</script>

<template>
    <AppLayout>
        <header class="page-header">
            <div><p class="eyebrow">{{ t('Mes animaux') }}</p><h1>{{ t(isEditing ? 'Modifier la fiche' : 'Ajouter un animal') }}</h1><p class="muted">{{ t('Renseignez les informations principales de l’animal.') }}</p></div>
            <RouterLink class="button button-quiet" :to="{ name: 'animals' }">{{ t('Retour aux animaux') }}</RouterLink>
        </header>
        <p v-if="loading" class="loading-text">{{ t('Chargement de la fiche…') }}</p>
        <form v-else class="panel form-panel" @submit.prevent="submit">
            <AlertMessage :message="error" />
            <div class="form-grid">
                <FormField id="animal_name" :label="t('Nom')" :error="errors.name">
                    <input id="animal_name" v-model.trim="form.name" maxlength="100" required>
                </FormField>
                <FormField id="livestock_type" :label="t('Type de bétail')" :error="errors.livestock_type_id">
                    <select id="livestock_type" v-model="form.livestock_type_id" required>
                        <option value="" disabled>{{ t('Choisir un type') }}</option>
                        <option v-for="type in types" :key="type.id" :value="String(type.id)">{{ t(type.name) }}</option>
                    </select>
                </FormField>
                <FormField id="tag_number" :label="t('Numéro de boucle')" :error="errors.tag_number" :hint="t('Facultatif, mais unique pour chaque animal.')">
                    <input id="tag_number" v-model.trim="form.tag_number" maxlength="100">
                </FormField>
                <FormField id="sex" :label="t('Sexe')" :error="errors.sex">
                    <select id="sex" v-model="form.sex">
                        <option value="">{{ t('Non renseigné') }}</option>
                        <option value="femelle">{{ t('Femelle') }}</option>
                        <option value="male">{{ t('Mâle') }}</option>
                    </select>
                </FormField>
                <FormField id="birth_date" :label="t('Date de naissance')" :error="errors.birth_date">
                    <input id="birth_date" v-model="form.birth_date" type="date">
                </FormField>
                <FormField id="mother_animal" :label="t('Mère')" :error="errors.mother_animal_id">
                    <select id="mother_animal" v-model="form.mother_animal_id">
                        <option value="">{{ t('Non renseignée') }}</option>
                        <option v-for="parent in parentOptions.filter((option) => String(option.id) !== String(route.params.id))" :key="parent.id" :value="String(parent.id)">
                            {{ parent.name }}{{ parent.sex === 'femelle' ? ` ${t('· Femelle')}` : parent.sex === 'male' ? ` ${t('· Mâle')}` : '' }}{{ parent.tag_number ? ` ${t('· Boucle')} ${parent.tag_number}` : '' }}
                        </option>
                    </select>
                </FormField>
                <FormField id="father_animal" :label="t('Père')" :error="errors.father_animal_id">
                    <select id="father_animal" v-model="form.father_animal_id">
                        <option value="">{{ t('Non renseigné') }}</option>
                        <option v-for="parent in parentOptions.filter((option) => String(option.id) !== String(route.params.id))" :key="parent.id" :value="String(parent.id)">
                            {{ parent.name }}{{ parent.sex === 'male' ? ` ${t('· Mâle')}` : parent.sex === 'femelle' ? ` ${t('· Femelle')}` : '' }}{{ parent.tag_number ? ` ${t('· Boucle')} ${parent.tag_number}` : '' }}
                        </option>
                    </select>
                </FormField>
                <fieldset class="choice-field">
                    <legend>{{ t('Mode de vie') }}</legend>
                    <p class="field-hint">{{ t('Choisissez une seule option.') }}</p>
                    <div class="choice-group">
                        <label class="choice-option">
                            <input v-model="form.housing_type" type="radio" name="housing_type" value="">
                            <span>{{ t('Non renseigné') }}</span>
                        </label>
                        <label class="choice-option">
                            <input v-model="form.housing_type" type="radio" name="housing_type" value="plein_air">
                            <span>{{ t('Plein air / prairie') }}</span>
                        </label>
                        <label class="choice-option">
                            <input v-model="form.housing_type" type="radio" name="housing_type" value="stabulation">
                            <span>{{ t('Stabulation') }}</span>
                        </label>
                    </div>
                    <small v-if="errors.housing_type" class="field-error" role="alert">{{ errors.housing_type }}</small>
                </fieldset>
                <FormField v-if="auth.user?.profile_type === 'eleveur'" id="exploitation" :label="t('Exploitation')" :error="errors.exploitation_id">
                    <select id="exploitation" v-model="form.exploitation_id">
                        <option value="">{{ t('Aucune exploitation') }}</option>
                        <option v-for="exploitation in exploitations" :key="exploitation.id" :value="String(exploitation.id)">{{ exploitation.name }}</option>
                    </select>
                </FormField>
            </div>
            <FormField id="comments" :label="t('Commentaires')" :error="errors.comments" :hint="t('500 caractères maximum.')">
                <textarea id="comments" v-model.trim="form.comments" maxlength="500" rows="4"></textarea>
            </FormField>
            <div class="form-actions">
                <RouterLink class="button button-quiet" :to="{ name: 'animals' }">{{ t('Annuler') }}</RouterLink>
                <button class="button button-primary" type="submit" :disabled="busy">{{ t(busy ? 'Enregistrement…' : 'Enregistrer la fiche') }}</button>
            </div>
        </form>
    </AppLayout>
</template>
