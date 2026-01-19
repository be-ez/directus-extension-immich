<template>
  <div v-if="imageValue" class="immich-display" :class="{ circle }">
    <img
      :src="imageUrl"
      :alt="imageValue.originalFileName"
      class="display-image"
      loading="lazy"
      @error="handleError"
    />
  </div>
  <span v-else class="no-image">--</span>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ImmichImageValue, ThumbnailSize } from '../shared/types';

interface Props {
  value: ImmichImageValue | ImmichImageValue[] | null;
  size?: ThumbnailSize;
  circle?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  value: null,
  size: 'thumbnail',
  circle: false,
});

const hasError = ref(false);

const imageValue = computed(() => {
  if (!props.value) return null;
  if (Array.isArray(props.value)) {
    return props.value[0] || null;
  }
  return props.value;
});

const imageUrl = computed(() => {
  if (!imageValue.value || hasError.value) return '';
  return `/immich?path=assets/${imageValue.value.id}/thumbnail?size=${props.size}`;
});

function handleError() {
  hasError.value = true;
}
</script>

<style scoped>
.immich-display {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  overflow: hidden;
  border-radius: var(--theme--border-radius);
  background: var(--theme--background-subdued);
}

.immich-display.circle {
  border-radius: 50%;
}

.display-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  color: var(--theme--foreground-subdued);
}
</style>
