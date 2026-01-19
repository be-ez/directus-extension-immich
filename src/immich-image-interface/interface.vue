<template>
  <div class="immich-image-interface">
    <!-- Selected image preview -->
    <div v-if="selectedImage" class="selected-preview">
      <div class="image-container">
        <img
          :src="thumbnailUrl"
          :alt="selectedImage.originalFileName"
          class="preview-image"
          @error="handleImageError"
        />
        <div class="image-overlay">
          <span class="filename">{{ selectedImage.originalFileName }}</span>
        </div>
      </div>
      <div class="actions">
        <v-button secondary small @click="openBrowser">
          <v-icon name="swap_horiz" />
          Change
        </v-button>
        <v-button secondary small kind="danger" @click="clearSelection">
          <v-icon name="close" />
          Remove
        </v-button>
      </div>
    </div>

    <!-- Empty state -->
    <v-button v-else @click="openBrowser" class="select-button">
      <v-icon name="add_photo_alternate" />
      Select from Immich
    </v-button>

    <!-- Image browser drawer -->
    <v-drawer
      v-model="browserOpen"
      title="Select Image from Immich"
      icon="photo_library"
      @cancel="browserOpen = false"
    >
      <template #actions>
        <v-button
          v-if="selectedAlbum && props.allowMultiple"
          v-tooltip.bottom="'Select All Images in Album'"
          secondary
          @click="selectAllFromAlbum"
        >
          <v-icon name="select_all" />
          Select Album
        </v-button>
        <v-button
          v-tooltip.bottom="'Refresh'"
          icon
          rounded
          secondary
          @click="refreshAssets"
        >
          <v-icon name="refresh" />
        </v-button>
      </template>

      <div class="drawer-content" ref="scrollContainer" @scroll="handleScroll">
        <!-- Filters -->
        <div class="filters">
          <div class="filter-header">
            <v-input
              v-model="searchQuery"
              placeholder="Search by filename..."
              @update:model-value="debouncedSearch"
              class="search-input"
            >
              <template #prepend>
                <v-icon name="search" />
              </template>
              <template #append>
                <v-icon
                  v-if="searchQuery"
                  name="close"
                  clickable
                  @click="clearSearch"
                />
              </template>
            </v-input>
            <v-button
              :secondary="!filtersOpen"
              :class="{ 'has-filters': hasActiveFilters }"
              @click="filtersOpen = !filtersOpen"
            >
              <v-icon name="tune" />
              Filters
              <span v-if="hasActiveFilters" class="filter-count">{{ activeFilterCount }}</span>
            </v-button>
          </div>
          <transition name="slide">
            <div v-if="filtersOpen" class="filter-options">
              <div class="filter-group">
                <div class="filter-label">Album</div>
                <v-select
                  v-model="selectedAlbum"
                  :items="albumOptions"
                  placeholder="All Albums"
                  show-deselect
                  @update:model-value="resetAndLoad"
                />
              </div>
              <div class="filter-group">
                <div class="filter-label">Camera Make</div>
                <div class="checkbox-list">
                  <label
                    v-for="make in cameraMakes"
                    :key="make"
                    class="checkbox-item"
                  >
                    <input
                      type="checkbox"
                      :value="make"
                      v-model="selectedMakes"
                      @change="resetAndLoad"
                    />
                    <span>{{ make }}</span>
                  </label>
                </div>
              </div>
              <div class="filter-group">
                <div class="filter-label">Camera Model</div>
                <div class="checkbox-list">
                  <label
                    v-for="model in cameraModels"
                    :key="model"
                    class="checkbox-item"
                  >
                    <input
                      type="checkbox"
                      :value="model"
                      v-model="selectedModels"
                      @change="resetAndLoad"
                    />
                    <span>{{ model }}</span>
                  </label>
                </div>
              </div>
            </div>
          </transition>
        </div>

        <!-- Loading state (initial) -->
        <div v-if="loading && displayAssets.length === 0" class="loading-state">
          <v-progress-circular indeterminate />
          <span>Loading images from Immich...</span>
        </div>

        <!-- Error state -->
        <v-notice v-else-if="error" type="danger">
          {{ error }}
        </v-notice>

        <!-- Image grid -->
        <template v-else>
          <div class="image-grid">
            <div
              v-for="asset in displayAssets"
              :key="asset.id"
              class="image-item"
              :class="{ selected: isSelected(asset), 'is-stack': getStackInfo(asset.id) }"
              @click="handleAssetClick(asset)"
            >
              <img
                :src="getAssetThumbnail(asset.id)"
                :alt="asset.originalFileName"
                loading="lazy"
              />
              <div class="item-overlay">
                <v-icon v-if="isSelected(asset)" name="check_circle" />
              </div>
              <!-- Stack indicator -->
              <div v-if="getStackInfo(asset.id)" class="stack-indicator">
                <v-icon name="layers" />
                <span>{{ getStackInfo(asset.id)?.assets.length }}</span>
              </div>
              <div class="item-filename">
                {{ asset.originalFileName }}
              </div>
            </div>
          </div>

          <!-- Load more trigger -->
          <div ref="loadMoreTrigger" class="load-more-trigger">
            <div v-if="loadingMore" class="loading-more">
              <v-progress-circular indeterminate small />
              <span>Loading more...</span>
            </div>
            <div v-else-if="!hasMore && displayAssets.length > 0" class="no-more">
              No more images
            </div>
          </div>
        </template>

        <!-- Empty state -->
        <v-notice v-if="!loading && !error && displayAssets.length === 0" type="info">
          No images found{{ hasActiveFilters || searchQuery ? ' matching your filters' : '' }}
        </v-notice>

        <!-- Results info -->
        <div v-if="!loading && displayAssets.length > 0" class="results-info">
          Showing {{ displayAssets.length }}{{ totalCount ? ` of ${totalCount}` : '' }} images
          <span v-if="stackCount > 0"> ({{ stackCount }} stacks)</span>
        </div>
      </div>
    </v-drawer>

    <!-- Stack picker drawer -->
    <v-drawer
      v-model="stackPickerOpen"
      :title="`Select from Stack (${activeStack?.assets.length || 0} images)`"
      icon="layers"
      @cancel="stackPickerOpen = false"
    >
      <div class="stack-picker-content">
        <div class="stack-grid">
          <div
            v-for="asset in activeStack?.assets || []"
            :key="asset.id"
            class="image-item"
            :class="{ selected: isSelected(asset) }"
            @click="selectFromStack(asset)"
          >
            <img
              :src="getAssetThumbnail(asset.id)"
              :alt="asset.originalFileName"
              loading="lazy"
            />
            <div class="item-overlay">
              <v-icon v-if="isSelected(asset)" name="check_circle" />
            </div>
            <div class="item-info">
              <div class="item-filename always-visible">{{ asset.originalFileName }}</div>
              <div v-if="asset.exifInfo" class="item-meta">
                {{ asset.exifInfo.make }} {{ asset.exifInfo.model }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </v-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useApi } from '@directus/extensions-sdk';
import type { ImmichAsset, ImmichAlbum, ImmichImageValue, ImmichStack } from '../shared/types';

interface Props {
  value: ImmichImageValue | ImmichImageValue[] | null;
  albumFilter?: string;
  allowMultiple?: boolean;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  value: null,
  albumFilter: '',
  allowMultiple: false,
  disabled: false,
});

const emit = defineEmits<{
  (e: 'input', value: ImmichImageValue | ImmichImageValue[] | null): void;
}>();

const api = useApi();

const browserOpen = ref(false);
const filtersOpen = ref(false);
const stackPickerOpen = ref(false);
const assets = ref<ImmichAsset[]>([]);
const albums = ref<ImmichAlbum[]>([]);
const stacks = ref<ImmichStack[]>([]);
const cameraMakes = ref<string[]>([]);
const cameraModels = ref<string[]>([]);
const loading = ref(false);
const loadingMore = ref(false);
const error = ref<string | null>(null);
const searchQuery = ref('');
const selectedAlbum = ref<string | null>(null);
const selectedMakes = ref<string[]>([]);
const selectedModels = ref<string[]>([]);
const currentPage = ref(1);
const hasMore = ref(true);
const totalCount = ref(0);
const scrollContainer = ref<HTMLElement | null>(null);
const loadMoreTrigger = ref<HTMLElement | null>(null);
const activeStack = ref<ImmichStack | null>(null);

let searchTimeout: ReturnType<typeof setTimeout> | null = null;
let observer: IntersectionObserver | null = null;

const PAGE_SIZE = 100;

// Map of assetId -> stack (for primary assets)
const stackMap = computed(() => {
  const map = new Map<string, ImmichStack>();
  for (const stack of stacks.value) {
    map.set(stack.primaryAssetId, stack);
  }
  return map;
});

// Set of all asset IDs that are in stacks (non-primary)
const stackedAssetIds = computed(() => {
  const ids = new Set<string>();
  for (const stack of stacks.value) {
    for (const asset of stack.assets) {
      if (asset.id !== stack.primaryAssetId) {
        ids.add(asset.id);
      }
    }
  }
  return ids;
});

// Filter out non-primary stacked assets from display
const displayAssets = computed(() => {
  return assets.value.filter(asset => !stackedAssetIds.value.has(asset.id));
});

const stackCount = computed(() => {
  let count = 0;
  for (const asset of displayAssets.value) {
    if (stackMap.value.has(asset.id)) count++;
  }
  return count;
});

const selectedImage = computed(() => {
  if (!props.value) return null;
  if (Array.isArray(props.value)) {
    return props.value[0] || null;
  }
  return props.value;
});

const thumbnailUrl = computed(() => {
  if (!selectedImage.value) return '';
  return `/immich?path=assets/${selectedImage.value.id}/thumbnail?size=preview`;
});

const albumOptions = computed(() => {
  return albums.value.map((album) => ({
    text: `${album.albumName} (${album.assetCount})`,
    value: album.id,
  }));
});

const hasActiveFilters = computed(() => {
  return !!(selectedAlbum.value || selectedMakes.value.length || selectedModels.value.length);
});

const activeFilterCount = computed(() => {
  let count = 0;
  if (selectedAlbum.value) count++;
  count += selectedMakes.value.length;
  count += selectedModels.value.length;
  return count;
});

function getAssetThumbnail(id: string): string {
  return `/immich?path=assets/${id}/thumbnail?size=thumbnail`;
}

function getStackInfo(assetId: string): ImmichStack | undefined {
  return stackMap.value.get(assetId);
}

function isSelected(asset: ImmichAsset): boolean {
  if (!props.value) return false;
  if (Array.isArray(props.value)) {
    return props.value.some((v) => v.id === asset.id);
  }
  return props.value.id === asset.id;
}

async function loadAlbums() {
  try {
    const response = await api.get('/immich/albums');
    albums.value = response.data || [];
  } catch (err) {
    console.error('Failed to load albums:', err);
  }
}

async function loadStacks() {
  try {
    const response = await api.get('/immich/stacks');
    stacks.value = response.data || [];
  } catch (err) {
    console.error('Failed to load stacks:', err);
  }
}

async function loadCameraMakes() {
  try {
    const response = await api.get('/immich/suggestions/camera-make');
    cameraMakes.value = response.data || [];
  } catch (err) {
    console.error('Failed to load camera makes:', err);
  }
}

async function loadCameraModels() {
  try {
    const response = await api.get('/immich/suggestions/camera-model');
    cameraModels.value = response.data || [];
  } catch (err) {
    console.error('Failed to load camera models:', err);
  }
}

async function loadAssets(append = false) {
  if (append) {
    loadingMore.value = true;
  } else {
    loading.value = true;
    currentPage.value = 1;
    hasMore.value = true;
  }
  error.value = null;

  try {
    if (selectedAlbum.value) {
      if (append) {
        loadingMore.value = false;
        return;
      }

      const response = await api.get(`/immich/albums/${selectedAlbum.value}`);
      let albumAssets = response.data.assets || [];

      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        albumAssets = albumAssets.filter((asset: ImmichAsset) =>
          asset.originalFileName.toLowerCase().includes(query)
        );
      }

      if (selectedMakes.value.length > 0) {
        albumAssets = albumAssets.filter((asset: ImmichAsset) => {
          const make = asset.exifInfo?.make || '';
          return selectedMakes.value.includes(make);
        });
      }
      if (selectedModels.value.length > 0) {
        albumAssets = albumAssets.filter((asset: ImmichAsset) => {
          const model = asset.exifInfo?.model || '';
          return selectedModels.value.includes(model);
        });
      }

      assets.value = albumAssets.filter((asset: ImmichAsset) => asset.type === 'IMAGE');
      hasMore.value = false;
      totalCount.value = assets.value.length;
    } else {
      const makesToQuery = selectedMakes.value.length > 0 ? selectedMakes.value : [null];
      const modelsToQuery = selectedModels.value.length > 0 ? selectedModels.value : [null];

      let allAssets: ImmichAsset[] = [];
      let total = 0;
      const seenIds = new Set<string>();

      for (const make of makesToQuery) {
        for (const model of modelsToQuery) {
          const searchBody: Record<string, unknown> = {
            type: 'IMAGE',
            size: PAGE_SIZE,
            page: currentPage.value,
          };

          if (searchQuery.value) {
            searchBody.originalFileName = searchQuery.value;
          }
          if (make) {
            searchBody.make = make;
          }
          if (model) {
            searchBody.model = model;
          }

          const response = await api.post('/immich/search', searchBody);

          if (response.data.assets?.items) {
            for (const asset of response.data.assets.items) {
              if (!seenIds.has(asset.id)) {
                seenIds.add(asset.id);
                allAssets.push(asset);
              }
            }
            total = Math.max(total, response.data.assets.total || 0);
          }

          if (!make && !model) break;
        }
        if (modelsToQuery.length === 1 && modelsToQuery[0] === null) continue;
      }

      totalCount.value = total;

      if (append) {
        assets.value = [...assets.value, ...allAssets];
      } else {
        assets.value = allAssets;
      }

      hasMore.value = allAssets.length >= PAGE_SIZE && selectedMakes.value.length <= 1 && selectedModels.value.length <= 1;
      currentPage.value++;
    }
  } catch (err: unknown) {
    console.error('Failed to load Immich assets:', err);
    error.value = err instanceof Error ? err.message : 'Failed to load images from Immich';
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
}

function handleScroll(event: Event) {
  const container = event.target as HTMLElement;
  const scrollBottom = container.scrollHeight - container.scrollTop - container.clientHeight;

  if (scrollBottom < 200 && hasMore.value && !loadingMore.value && !loading.value) {
    loadAssets(true);
  }
}

function setupIntersectionObserver() {
  if (observer) {
    observer.disconnect();
  }

  observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && hasMore.value && !loadingMore.value && !loading.value) {
        loadAssets(true);
      }
    },
    {
      root: scrollContainer.value,
      rootMargin: '200px',
      threshold: 0,
    }
  );

  if (loadMoreTrigger.value) {
    observer.observe(loadMoreTrigger.value);
  }
}

function resetAndLoad() {
  assets.value = [];
  currentPage.value = 1;
  hasMore.value = true;
  loadAssets();
}

function debouncedSearch() {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(() => {
    resetAndLoad();
  }, 300);
}

function clearSearch() {
  searchQuery.value = '';
  resetAndLoad();
}

function refreshAssets() {
  loadAlbums();
  loadStacks();
  loadCameraMakes();
  loadCameraModels();
  resetAndLoad();
}

function handleAssetClick(asset: ImmichAsset) {
  const stack = getStackInfo(asset.id);
  if (stack && stack.assets.length > 1) {
    // Open stack picker
    activeStack.value = stack;
    stackPickerOpen.value = true;
  } else {
    selectImage(asset);
  }
}

function selectFromStack(asset: ImmichAsset) {
  selectImage(asset);
  stackPickerOpen.value = false;
  activeStack.value = null;
}

function selectImage(asset: ImmichAsset) {
  const imageValue: ImmichImageValue = {
    id: asset.id,
    originalFileName: asset.originalFileName,
    type: asset.type,
    thumbhash: asset.thumbhash,
  };

  if (props.allowMultiple) {
    const current = Array.isArray(props.value) ? props.value : props.value ? [props.value] : [];
    const existing = current.findIndex((v) => v.id === asset.id);

    if (existing >= 0) {
      const updated = [...current];
      updated.splice(existing, 1);
      emit('input', updated.length > 0 ? updated : null);
    } else {
      emit('input', [...current, imageValue]);
    }
  } else {
    emit('input', imageValue);
    browserOpen.value = false;
  }
}

function selectAllFromAlbum() {
  if (!props.allowMultiple) return;

  const imageValues: ImmichImageValue[] = displayAssets.value.map((asset) => ({
    id: asset.id,
    originalFileName: asset.originalFileName,
    type: asset.type,
    thumbhash: asset.thumbhash,
  }));

  emit('input', imageValues.length > 0 ? imageValues : null);
}

function clearSelection() {
  emit('input', null);
}

function openBrowser() {
  if (props.disabled) return;
  browserOpen.value = true;
}

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement;
  img.style.display = 'none';
}

watch(browserOpen, async (open) => {
  if (open) {
    if (albums.value.length === 0) {
      loadAlbums();
    }
    if (stacks.value.length === 0) {
      loadStacks();
    }
    if (cameraMakes.value.length === 0) {
      loadCameraMakes();
    }
    if (cameraModels.value.length === 0) {
      loadCameraModels();
    }
    if (assets.value.length === 0) {
      await loadAssets();
    }
    await nextTick();
    setupIntersectionObserver();
  } else {
    if (observer) {
      observer.disconnect();
    }
  }
});

onMounted(() => {
  if (props.albumFilter) {
    selectedAlbum.value = props.albumFilter;
  }
});

onUnmounted(() => {
  if (observer) {
    observer.disconnect();
  }
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
});
</script>

<style scoped>
.immich-image-interface {
  width: 100%;
}

.selected-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.image-container {
  position: relative;
  border-radius: var(--theme--border-radius);
  overflow: hidden;
  background: var(--theme--background-subdued);
}

.preview-image {
  width: 100%;
  max-height: 300px;
  object-fit: contain;
  display: block;
}

.image-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px 12px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  color: white;
}

.filename {
  font-size: 12px;
  opacity: 0.9;
}

.actions {
  display: flex;
  gap: 8px;
}

.select-button {
  width: 100%;
}

.drawer-content {
  padding: 0;
  min-height: 400px;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.filters {
  position: sticky;
  top: 0;
  background: var(--theme--background);
  border-bottom: 1px solid var(--theme--border-color-subdued);
  z-index: 10;
}

.filter-header {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  align-items: center;
}

.filter-header .search-input {
  flex: 1;
}

.filter-header .has-filters {
  background: var(--theme--primary);
  color: white;
}

.filter-count {
  background: white;
  color: var(--theme--primary);
  border-radius: 10px;
  padding: 0 6px;
  font-size: 11px;
  font-weight: 600;
  margin-left: 4px;
}

.filter-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 16px 20px;
  background: var(--theme--background-subdued);
  border-top: 1px solid var(--theme--border-color-subdued);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--theme--foreground-subdued);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.checkbox-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 200px;
  overflow-y: auto;
  background: var(--theme--background);
  border-radius: var(--theme--border-radius);
  padding: 8px;
  border: 1px solid var(--theme--border-color-subdued);
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.1s ease;
}

.checkbox-item:hover {
  background: var(--theme--background-subdued);
}

.checkbox-item input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--theme--primary);
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.slide-enter-to,
.slide-leave-from {
  opacity: 1;
  max-height: 100px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 60px 40px;
  color: var(--theme--foreground-subdued);
}

.image-grid,
.stack-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  padding: 20px;
}

.image-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: var(--theme--border-radius);
  overflow: hidden;
  cursor: pointer;
  background: var(--theme--background-subdued);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.image-item:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.image-item.selected {
  outline: 3px solid var(--theme--primary);
  outline-offset: -3px;
}

.image-item.is-stack {
  outline: 2px dashed var(--theme--primary-subdued);
  outline-offset: -2px;
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-overlay {
  position: absolute;
  top: 8px;
  right: 8px;
  color: var(--theme--primary);
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-overlay .v-icon {
  --v-icon-size: 24px;
}

.stack-indicator {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
}

.stack-indicator .v-icon {
  --v-icon-size: 14px;
}

.item-filename {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 4px 8px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  color: white;
  font-size: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.image-item:hover .item-filename {
  opacity: 1;
}

.item-filename.always-visible {
  opacity: 1;
}

.item-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  color: white;
}

.item-meta {
  font-size: 9px;
  opacity: 0.7;
  margin-top: 2px;
}

.load-more-trigger {
  padding: 20px;
  display: flex;
  justify-content: center;
}

.loading-more {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--theme--foreground-subdued);
}

.no-more {
  color: var(--theme--foreground-subdued);
  font-size: 12px;
}

.results-info {
  padding: 16px 20px;
  text-align: center;
  color: var(--theme--foreground-subdued);
  font-size: 12px;
}

.drawer-content > .v-notice {
  margin: 20px;
}

.stack-picker-content {
  padding: 0;
  min-height: 300px;
}
</style>
