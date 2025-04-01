<template>
  <component
    :is="icon"
    theme="outline"
    size="40"
    fill="#4098fc"
    :stroke-width="3"
    :class="{ flipped }"
  />
</template>

<script setup lang="ts">
defineProps<{
  icon: any;
  flipped?: boolean;
}>();
</script>

<style scoped>
.flipped {
  transform: scaleX(-1);
}
</style>
