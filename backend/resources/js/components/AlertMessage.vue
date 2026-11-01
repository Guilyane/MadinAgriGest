<script setup>
defineProps({
    message: { type: String, default: '' },
    kind: { type: String, default: 'error' },
});
</script>

<template>
    <p v-if="message" class="alert" :class="`alert-${kind}`" role="alert">{{ message }}</p>
</template>
