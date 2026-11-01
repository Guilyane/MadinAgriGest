<script setup>
defineProps({
    id: { type: String, required: true },
    label: { type: String, required: true },
    error: { type: String, default: '' },
    hint: { type: String, default: '' },
});
</script>

<template>
    <div class="form-field">
        <label :for="id">{{ label }}</label>
        <slot />
        <small v-if="hint" class="field-hint">{{ hint }}</small>
        <small v-if="error" class="field-error" role="alert">{{ error }}</small>
    </div>
</template>
