<script setup lang="ts">
import * as Y from 'yjs'
import { computed, nextTick, onBeforeUpdate, onMounted, onUnmounted, ref, watch } from 'vue'
import DeleteButton from './buttons/DeleteButton.vue'
import EditButton from './buttons/EditButton.vue'
import EditableText from './EditableText.vue'
import LooseTag from './LooseTag.vue'
import MightAspect from './MightAspect.vue'
import NewMightAspect from './NewMightAspect.vue'
import NewLooseTags from './NewLooseTags.vue'
import { useMode } from '../lib/modeStore'
import {
  DEFAULT_SITUATION_BACKGROUND_COLOR,
  mightOptions,
  type Might,
  type MightAspectShard,
  type SituationData,
  type StatusTagShard,
  type TagShard,
} from '../lib/schema'
import { createStatusTagShard, type StatusCreationProps } from '../lib/StatusTag'
import { createTagShard, type TagCreationProps } from '../lib/Tag'
import { createMightAspectShard } from '../lib/Situation'
import { useYArray, useYMapField } from '../lib/yjsComposables'
import { useDragDrop } from '../lib/util'
import toYamlBlack from '../assets/to-yaml-black.svg'
import Masonry from 'masonry-layout'
import { normalizeCssColor, toColorInputValue } from '../lib/colors'
import { mightIcon } from '../lib/mightIcons'
import { stringifyYaml } from '../lib/yaml'

const { mode, enableNameEditing } = useMode()

const props = defineProps<{
  shard: Y.Map<any>
}>()

const emit = defineEmits<{
  (e: 'delete'): void
  (e: 'resized'): void
}>()

const grid = ref(null)

const situationName = useYMapField<SituationData, 'situationName'>(
  props.shard,
  'situationName',
  ''
)
const baseMight = useYMapField<SituationData, 'baseMight'>(
  props.shard,
  'baseMight',
  'origin'
)
const backgroundColor = useYMapField<SituationData, 'backgroundColor'>(
  props.shard,
  'backgroundColor',
  DEFAULT_SITUATION_BACKGROUND_COLOR
)
const situationStyle = computed(()=> ({
  backgroundColor: normalizeCssColor(backgroundColor.value, DEFAULT_SITUATION_BACKGROUND_COLOR),
}))
const backgroundColorInput = computed({
  get: ()=> toColorInputValue(backgroundColor.value, DEFAULT_SITUATION_BACKGROUND_COLOR),
  set: (value: string)=> {
    backgroundColor.value = value
  },
})
const canEditBaseMight = computed(()=> enableNameEditing.value && mode.value === 'narrator')
const isEditingBaseMight = ref(false)
const baseMightRef = ref<HTMLElement | null>(null)
let pointerDownInsideBaseMight = false

watch(canEditBaseMight, canEdit=> {
  if (!canEdit) isEditingBaseMight.value = false
})

function handleBaseMightFocusOut(event: FocusEvent) {
  if (pointerDownInsideBaseMight) return

  const nextTarget = event.relatedTarget
  if (nextTarget instanceof Node && baseMightRef.value?.contains(nextTarget)) return

  isEditingBaseMight.value = false
}

function handleBaseMightPointerDown() {
  pointerDownInsideBaseMight = true
  window.setTimeout(()=> {
    pointerDownInsideBaseMight = false
  }, 0)
}

function handleDocumentPointerDown(event: PointerEvent) {
  if (!isEditingBaseMight.value) return
  const target = event.target
  if (target instanceof Node && baseMightRef.value?.contains(target)) return

  isEditingBaseMight.value = false
}

const {
  items: mightAspects,
  push: addMightAspect,
  remove: removeMightAspect,
  move: moveMightAspect,
} = useYArray<MightAspectShard>(props.shard, 'mightAspects', reflowMasonry)

const {
  onDrag: onMightAspectDrag,
  onDrop: onMightAspectDrop,
} = useDragDrop(moveMightAspect, reflowMasonry)

const {
  items: looseTags,
  push: addLooseTag,
  remove: removeLooseTag,
  move: moveLooseTag,
} = useYArray<TagShard | StatusTagShard>(props.shard, 'looseTags', reflowMasonry)

const {
  onDrag: onLooseTagDrag,
  onDrop: onLooseTagDrop,
} = useDragDrop(moveLooseTag, reflowMasonry)

const mightAspectRefs = ref<any[]>([])
const looseTagRefs = ref<any[]>([])

function setMightAspectRef(el: any) {
  if (el) mightAspectRefs.value.push(el)
}

function setLooseTagRef(el: any) {
  if (el) looseTagRefs.value.push(el)
}

onBeforeUpdate(()=> {
  mightAspectRefs.value = []
  looseTagRefs.value = []
})

let masonry: Masonry | null = null

onMounted(async ()=> {
  document.addEventListener('pointerdown', handleDocumentPointerDown)
  await nextTick()
  if (!grid.value) return
  masonry = new Masonry(grid.value, {
    itemSelector: '.grid-item',
    columnWidth: '.grid-sizer',
    gutter: 16,
  })
  reflowMasonry()
})

onUnmounted(()=> {
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
})

async function reflowMasonry() {
  await nextTick()
  masonry?.reloadItems?.()
  masonry?.layout?.()
}

watch(mode, async ()=> {
  await nextTick()
  reflowMasonry()
})

function handleCreateLooseTag(data: TagCreationProps) {
  addLooseTag(createTagShard(data))
}

function handleCreateLooseStatus(data: StatusCreationProps) {
  addLooseTag(createStatusTagShard(data))
}

function handleCreateMightAspect(data: { might: Might, name: string }) {
  addMightAspect(createMightAspectShard(data))
}

function toJson() {
  return {
    situationName: situationName.value,
    backgroundColor: backgroundColor.value,
    baseMight: baseMight.value,
    mightAspects: mightAspectRefs.value.map(aspect=> aspect.toJson()),
    looseTags: looseTagRefs.value.map(lt=> lt.toJson()),
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
  <div ref="grid" class="situation" :style="situationStyle">
    <div class="situation-card grid-item grid-sizer">
      <DeleteButton v-if="mode == 'narrator'" @delete="emit('delete')" />

      <div class="static-words">
        <p>SITUATION</p>
        <input
          v-if="mode == 'narrator'"
          v-model="backgroundColorInput"
          type="color"
          class="background-color-input"
          aria-label="Set situation background color"
          title="Set situation background color"
        >
        <button
          type="button"
          class="copy-button"
          aria-label="Copy situation YAML"
          title="Copy situation YAML"
          @click="copyToClipboard"
        >
          <img :src="toYamlBlack" alt="" class="copy-icon" aria-hidden="true">
        </button>
      </div>

      <div class="situation-name">
        <EditableText
          v-model="situationName"
          tag="h1"
          placeholder="Enter Situation Name ..."
          :disabled="!enableNameEditing || mode !== 'narrator'"
          @resized="reflowMasonry"
        />
      </div>

      <div
        ref="baseMightRef"
        class="base-might"
        @pointerdown.capture="handleBaseMightPointerDown"
        @focusout="handleBaseMightFocusOut"
      >
        <template v-if="isEditingBaseMight">
          <label
            v-for="option in mightOptions"
            :key="option"
            class="might-option"
            :title="option"
          >
            <input
              type="radio"
              :name="`situation-base-might-${shard.get('uuid')}`"
              :value="option"
              :checked="baseMight === option"
              :aria-label="option"
              @change="baseMight = option"
            >
            <img :src="mightIcon(option)" :alt="option" class="might-icon">
          </label>
        </template>

        <img
          v-else
          :src="mightIcon(baseMight)"
          :alt="baseMight"
          class="might-icon"
        >

        <EditButton
          v-if="canEditBaseMight"
          @edit="isEditingBaseMight = !isEditingBaseMight"
        />
      </div>
    </div>

    <MightAspect
      v-for="(mightAspect, index) in mightAspects"
      :key="mightAspect.get('uuid')"
      :ref="setMightAspectRef"
      :shard="mightAspect"
      class="grid-item"
      draggable="true"
      @dragstart="onMightAspectDrag(index)"
      @dragover.prevent
      @drop="onMightAspectDrop(index)"
      @delete="removeMightAspect(index)"
      @resized="reflowMasonry"
    />

    <NewMightAspect
      v-if="mode == 'narrator'"
      class="grid-item"
      @create="handleCreateMightAspect"
    />

    <LooseTag
      v-for="(looseTag, index) in looseTags"
      :key="looseTag.get('uuid')"
      :ref="setLooseTagRef"
      :shard="looseTag"
      class="grid-item"
      draggable="true"
      @dragstart="onLooseTagDrag(index)"
      @dragover.prevent
      @drop="onLooseTagDrop(index)"
      @delete="removeLooseTag(index)"
      @resized="reflowMasonry"
    />

    <NewLooseTags
      v-if="mode == 'narrator'"
      class="grid-item"
      @create-tag="handleCreateLooseTag"
      @create-status="handleCreateLooseStatus"
    />
  </div>
</template>

<style scoped>
.situation {
  position: relative;
  border: 3px solid #777;
  width: 100%;
  padding: 1rem;
  scroll-margin-top: 5.5rem;
}

.situation > * {
  margin-bottom: 16px;
}

.grid-sizer,
.grid-item {
  width: 25rem;
  max-width: 100%;
}

.situation-card {
  box-sizing: border-box;
  border: 0.25rem solid #777;

  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;

  background: #f4f4f4;
}

.situation-name {
  width: 100%;
  display: flex;
  justify-content: center;
  color: #222;
}

.situation-name :deep(.editable-component) {
  text-align: center;
}

.base-might {
  position: relative;
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  padding-bottom: 0.5rem;
  min-height: 2.5rem;
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

.static-words {
  background-color: #d7d7d7;
  color: #222;
}

.copy-button:hover,
.copy-button:focus-visible {
  background: rgba(255, 255, 255, 0.7);
}
</style>
