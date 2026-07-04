<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import * as Y from 'yjs'
import DeleteButton from './buttons/DeleteButton.vue'
import EditButton from './buttons/EditButton.vue'
import { useMode } from '../lib/modeStore'
import { useYMapField } from '../lib/yjsComposables'
import { mightOptions, type Might, type MightAspectData } from '../lib/schema'
import { mightColor, mightIcon } from '../lib/mightIcons'

const { mode, enableNameEditing } = useMode()

const props = defineProps<{
  shard: Y.Map<any>
}>()

const might = useYMapField<MightAspectData, 'might'>(props.shard, 'might', 'origin')
const name = useYMapField<MightAspectData, 'name'>(props.shard, 'name', '')
const canEdit = computed(()=> enableNameEditing.value && mode.value === 'narrator')
const isEditing = ref(false)
const aspectStyle = computed(()=> ({
  borderColor: mightColor(might.value),
}))
const mightAspectRef = ref<HTMLElement | null>(null)
let pointerDownInsideMightAspect = false

watch(canEdit, canEditNow=> {
  if (!canEditNow) isEditing.value = false
})

function handleFocusOut(event: FocusEvent) {
  if (pointerDownInsideMightAspect) return

  const nextTarget = event.relatedTarget
  if (nextTarget instanceof Node && mightAspectRef.value?.contains(nextTarget)) return

  isEditing.value = false
}

function handlePointerDown() {
  pointerDownInsideMightAspect = true
  window.setTimeout(()=> {
    pointerDownInsideMightAspect = false
  }, 0)
}

function handleDocumentPointerDown(event: PointerEvent) {
  if (!isEditing.value) return
  const target = event.target
  if (target instanceof Node && mightAspectRef.value?.contains(target)) return

  isEditing.value = false
}

onMounted(()=> {
  document.addEventListener('pointerdown', handleDocumentPointerDown)
})

onUnmounted(()=> {
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
})

const emit = defineEmits<{
  (e: 'delete'): void
  (e: 'resized'): void
}>()

function toggleEditing() {
  isEditing.value = !isEditing.value
}

function trimName() {
  name.value = name.value.trim()
  emit('resized')
}

function toJson() {
  return {
    might: might.value,
    name: name.value,
  }
}

defineExpose({
  toJson,
})
</script>

<template>
  <div
    ref="mightAspectRef"
    class="might-aspect"
    :style="aspectStyle"
    @pointerdown.capture="handlePointerDown"
    @focusout="handleFocusOut"
  >
    <DeleteButton v-if="mode !== 'scene'" @delete="emit('delete')" />

    <div class="might-aspect-details">
      <div class="might-aspect-might">
        <template v-if="isEditing">
          <label
            v-for="option in mightOptions"
            :key="option"
            class="might-option"
            :title="option"
          >
            <input
              type="radio"
              :name="`might-aspect-${shard.get('uuid')}`"
              :value="option"
              :checked="might === option"
              :aria-label="option"
              @change="might = option"
            >
            <img :src="mightIcon(option)" :alt="option" class="might-icon">
          </label>
        </template>

        <img
          v-else
          :src="mightIcon(might)"
          :alt="might"
          class="might-icon"
        >

        <EditButton
          v-if="canEdit"
          @edit="toggleEditing"
        />
      </div>

      <input
        v-if="isEditing"
        v-model="name"
        class="might-aspect-name-input"
        placeholder="Enter might aspect ..."
        @input="emit('resized')"
        @blur="trimName"
      >
      <p v-else class="might-aspect-name">{{ name }}</p>
    </div>
  </div>
</template>

<style scoped>
.might-aspect {
  position: relative;
  box-sizing: border-box;
  width: 25rem;
  max-width: 100%;
  padding: 0.65rem 0.8rem;
  border: 0.25rem solid #777;
  background: #f4f4f4;
  color: #222;

  display: flex;
  align-items: center;
}

.might-aspect-details {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;

  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.might-aspect-might {
  position: relative;
  flex: 0 0 auto;
  display: flex;
  gap: 0.4rem;
}

.might-option {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.might-icon {
  width: 2.1rem;
  height: 2.1rem;
  display: block;
}

.might-aspect-name {
  flex: 1 1 auto;
  min-width: 0;
  margin: 0.35rem 0;
  font-size: larger;
}

.might-aspect-name-input {
  flex: 1 1 auto;
  min-width: 0;
  box-sizing: border-box;
  font: inherit;
  font-size: larger;
  padding: 0.25rem 0.35rem;
  border: 0.15rem solid #777;
  border-radius: 0.25rem;
  background: white;
  color: #222;
}
</style>
