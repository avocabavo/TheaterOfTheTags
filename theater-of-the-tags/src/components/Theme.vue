<script setup lang="ts">
import * as Y from 'yjs'
import Tag from './Tag.vue'
import { createTagShard, type TagCreationProps } from '../lib/Tag';
import { mightOptions, themeTypeOptions } from '../lib/schema';
import { useYMapField, useYArray, useYChildMap } from '../lib/yjsComposables';
import type { TagShard, ThemeData } from '../lib/schema';
import DeleteButton from './/buttons/DeleteButton.vue';
import EditButton from './buttons/EditButton.vue';
import { useMode } from '../lib/modeStore';
import NewTag from './NewTag.vue';
import Quest from './Quest.vue';
import Bubbles from './Bubbles.vue';
import { computed, onBeforeUpdate, onMounted, onUnmounted, ref, watch } from 'vue';
import { useDragDrop, useFieldCollector } from '../lib/util';
import toYamlBlack from '../assets/to-yaml-black.svg'
import { mightColor, mightIcon } from '../lib/mightIcons'
import { stringifyYaml } from '../lib/yaml'

const { mode, enableNameEditing } = useMode()

const props = defineProps<{
  shard: Y.Map<any>
}>()

const might = useYMapField<ThemeData, 'might'>(props.shard, 'might', 'origin')
const themeType = useYMapField<ThemeData, 'themeType'>(props.shard, 'themeType', 'circumstance')
const isEditingThemeDetails = ref(false)
const canEditThemeDetails = computed(()=> enableNameEditing.value && mode.value === 'creation')
const themeStyle = computed(()=> ({
  backgroundColor: mightColor(might.value),
}))
const themeDetailsRef = ref<HTMLElement | null>(null)
let pointerDownInsideThemeDetails = false

watch(canEditThemeDetails, canEdit=> {
  if (!canEdit) isEditingThemeDetails.value = false
})

function handleThemeDetailsFocusOut(event: FocusEvent) {
  if (pointerDownInsideThemeDetails) return

  const nextTarget = event.relatedTarget
  if (nextTarget instanceof Node && themeDetailsRef.value?.contains(nextTarget)) return

  isEditingThemeDetails.value = false
}

function handleThemeDetailsPointerDown() {
  pointerDownInsideThemeDetails = true
  window.setTimeout(()=> {
    pointerDownInsideThemeDetails = false
  }, 0)
}

function handleDocumentPointerDown(event: PointerEvent) {
  if (!isEditingThemeDetails.value) return
  const target = event.target
  if (target instanceof Node && themeDetailsRef.value?.contains(target)) return

  isEditingThemeDetails.value = false
}

const { items: powerTags, push: addPowerTag, remove: removePowerTag, move:movePowerTag } =
  useYArray<TagShard>(props.shard, 'powerTags', ()=> emit('resized'))

const {
  items: weaknessTags,
  push: addWeaknessTag,
  remove: removeWeaknessTag,
  move: moveWeaknessTag
} = useYArray<TagShard>(props.shard, 'weaknessTags', ()=> emit('resized'))

const { child: primaryTag, clear: clearPrimaryTag, set: setPrimaryTag } = useYChildMap(
  props.shard,
  'primaryTag',
  ()=> emit('resized'),
)

const emit = defineEmits<{
  (e: 'delete'): void,
  (e: 'resized'): void,
}>()

function handleCreateTag(data: TagCreationProps) {
  const newShard = createTagShard(data)

  switch (data.nature) {
    case 'primary':
      setPrimaryTag(newShard)
      break;
    case 'power':
      addPowerTag(newShard)
      break;
    case 'weakness':
      addWeaknessTag(newShard)
      break;
  }
}

const { fieldRefs, setFieldRef } = useFieldCollector()

const primaryTagRef = ref<any | null>(null)
const powerTagRefs = ref<any[]>([])
const weaknessTagRefs = ref<any[]>([])

function setPrimaryTagRef(el: any) {
  primaryTagRef.value = el
}
function setPowerTagRef(el: any) {
  if (el) powerTagRefs.value.push(el)
}
function setWeaknessTagRef(el: any) {
  if (el) weaknessTagRefs.value.push(el)
}

onBeforeUpdate(()=> {
  powerTagRefs.value = []
  weaknessTagRefs.value = []
})

onMounted(()=> {
  document.addEventListener('pointerdown', handleDocumentPointerDown)
})

onUnmounted(()=> {
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
})

const {
  onDrag: onPowerDragStart,
  onDrop: onPowerDrop,
} = useDragDrop(movePowerTag, ()=> emit('resized'))

const {
  onDrag: onWeaknessDragStart,
  onDrop: onWeaknessDrop,
} = useDragDrop(moveWeaknessTag, ()=> emit('resized'))

function toJson() {
  return {
    ...Object.assign(
      {},
      ...fieldRefs.value.map(b=> b.toJson())
    ),
    might: might.value,
    themeType: themeType.value,
    primaryTag: primaryTagRef.value?.toJson() ?? null,
    powerTags: powerTagRefs.value.map(t=> t.toJson()),
    weaknessTags: weaknessTagRefs.value.map(t=> t.toJson()),
  }
}

function toYaml() {
  return stringifyYaml(toJson())
}

async function copyToClipboard() {
  await navigator.clipboard.writeText(toYaml())
}

defineExpose({
  toJson
})
</script>

<template>
  <div class="theme" :style="themeStyle">
    <DeleteButton v-if="mode !== 'scene'" @delete="emit('delete')" />

    <div class="static-words">
      <p>THEME CARD</p>
      <button
        type="button"
        class="copy-button"
        aria-label="Copy theme card YAML"
        title="Copy theme card YAML"
        @click="copyToClipboard"
      >
        <img :src="toYamlBlack" alt="" class="copy-icon" aria-hidden="true">
      </button>
    </div>

    <div class="tag-section">
      <Tag
        v-if="primaryTag"
        :ref="setPrimaryTagRef"
        :shard="primaryTag"
        @delete="clearPrimaryTag"
        @resized="emit('resized')"
      />
      <NewTag
        v-else-if="mode !== 'scene'"
        nature="primary"
        @create="handleCreateTag"
      />
    </div>

    <div
      ref="themeDetailsRef"
      class="theme-details"
      @pointerdown.capture="handleThemeDetailsPointerDown"
      @focusout="handleThemeDetailsFocusOut"
    >
      <template v-if="!isEditingThemeDetails">
        <img
          :src="mightIcon(might)"
          :alt="might"
          class="might-icon"
        >
        <span class="theme-type">{{ themeType }}</span>
      </template>

      <template v-else>
        <div class="might">
          <label
            v-for="option in mightOptions"
            :key="option"
            class="might-option"
            :title="option"
          >
            <input
              type="radio"
              :name="`might-${shard.get('uuid')}`"
              :value="option"
              :checked="might === option"
              @change="might = option"
              :aria-label="option"
            />
            <img
              :src="mightIcon(option)"
              :alt="option"
              class="might-icon"
            >
          </label>
        </div>

        <select v-model="themeType" class="theme-type-select">
          <option
            v-for="option in themeTypeOptions"
            :key="option"
            :value="option"
          >
            {{ option }}
          </option>
        </select>
      </template>

      <EditButton
        v-if="canEditThemeDetails"
        @edit="isEditingThemeDetails = !isEditingThemeDetails"
      />
    </div>

    <div class="tag-section">
      <Tag
        v-for="(tag, index) in powerTags"
        :key="tag.get('uuid')"
        :ref="setPowerTagRef"
        :shard="tag"
        draggable="true"
        @dragstart="onPowerDragStart(index)"
        @dragover.prevent
        @drop="onPowerDrop(index)"
        @delete="removePowerTag(index)"
        @resized="emit('resized')"
      />
      <NewTag
        v-if="mode !== 'scene'"
        nature="power"
        @create="handleCreateTag"
      />
    </div>

    <div class="tag-section">
      <Tag
        v-for="(tag, index) in weaknessTags"
        :key="tag.get('uuid')"
        :ref="setWeaknessTagRef"
        :shard="tag"
        draggable="true"
        @dragstart="onWeaknessDragStart(index)"
        @dragover.prevent
        @drop="onWeaknessDrop(index)"
        @delete="removeWeaknessTag(index)"
        @resized="emit('resized')"
      />
      <NewTag
        v-if="mode !== 'scene'"
        nature="weakness"
        @create="handleCreateTag"
      />
    </div>

    <div class="quest-section">
      <Quest
        class="theme-quest"
        :shard="shard"
        :ref="setFieldRef"
        @resized="emit('resized')"
      />
    </div>

    <div class="tag-section">
      <div class="quest-aim">
        <Bubbles
          v-for="field in ['abandon', 'improve', 'milestone']"
          :key="field"
          :ref="setFieldRef"
          :shard="shard"
          :field="field"
          :max="3"
          :name="field.toUpperCase()"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.theme {
  --theme-banner-bg: #764;
  --theme-banner-fg: #f6ecd8;

  position: relative;
  box-sizing: border-box;
  border: 0.25rem solid var(--theme-banner-bg);

  width: 25rem;
  padding: 0;

  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.static-words {
  width: 100%;
  margin-top: 0;
  background: var(--theme-banner-bg);
  color: var(--theme-banner-fg);
}

.static-words p {
  color: inherit;
}

.copy-button:hover,
.copy-button:focus-visible {
  background: rgba(255, 255, 255, 0.25);
}

.theme-details {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  min-height: 2.5rem;
}

.might {
  display: flex;
  gap: 0.75rem;
}

.might-option {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
}

.might-icon {
  width: 2.1rem;
  height: 2.1rem;
  display: block;
}

.theme-type {
  margin-top: 0.2rem;
  margin-bottom: 0.2rem;
  display: flex;
  align-items: baseline;
  color: black;
}

.theme-type-select {
  min-width: 0;
  max-width: 13rem;
  font: inherit;
  background: rgba(255, 255, 255, 0.75);
  color: black;
}

.tag-section {
  box-sizing: border-box;
  width: 100%;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  align-items: center;
}

.quest-section {
  box-sizing: border-box;
  width: 100%;
  padding: 0;
}

.theme-quest {
  box-sizing: border-box;
  width: 100%;
  margin: 0;
  padding: 0;
}

.theme-quest :deep(.static-words) {
  box-sizing: border-box;
  width: 100%;
  margin-left: 0;
  margin-right: 0;
  margin-top: 0;
  margin-bottom: 0.5rem;
  padding: 0.2rem 0;
  background: var(--theme-banner-bg);
  color: var(--theme-banner-fg);
  font-size: large;
}

.quest-aim {
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: baseline;
  justify-content: space-around;
}
</style>
