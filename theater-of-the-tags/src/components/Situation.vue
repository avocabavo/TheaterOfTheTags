<script setup lang="ts">
import * as Y from 'yjs'
import YAML from 'yaml'
import { computed, nextTick, onBeforeUpdate, onMounted, ref, watch } from 'vue'
import DeleteButton from './buttons/DeleteButton.vue'
import EditableText from './EditableText.vue'
import LooseTag from './LooseTag.vue'
import NewLooseTags from './NewLooseTags.vue'
import { useMode } from '../lib/modeStore'
import {
  DEFAULT_SITUATION_BACKGROUND_COLOR,
  type SituationData,
  type StatusTagShard,
  type TagShard,
} from '../lib/schema'
import { createStatusTagShard, type StatusCreationProps } from '../lib/StatusTag'
import { createTagShard, type TagCreationProps } from '../lib/Tag'
import { useYArray, useYMapField } from '../lib/yjsComposables'
import { useDragDrop } from '../lib/util'
import toYamlBlack from '../assets/to-yaml-black.svg'
import Masonry from 'masonry-layout'
import { normalizeCssColor, toColorInputValue } from '../lib/colors'

const { mode } = useMode()

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

const looseTagRefs = ref<any[]>([])

function setLooseTagRef(el: any) {
  if (el) looseTagRefs.value.push(el)
}

onBeforeUpdate(()=> {
  looseTagRefs.value = []
})

let masonry: Masonry | null = null

onMounted(async ()=> {
  await nextTick()
  if (!grid.value) return
  masonry = new Masonry(grid.value, {
    itemSelector: '.grid-item',
    columnWidth: '.grid-sizer',
    gutter: 16,
  })
  reflowMasonry()
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

function toJson() {
  return {
    situationName: situationName.value,
    backgroundColor: backgroundColor.value,
    looseTags: looseTagRefs.value.map(lt=> lt.toJson()),
  }
}

function toYaml() {
  return YAML.stringify(toJson(), null, 2)
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
      <DeleteButton v-if="mode !== 'scene'" @delete="emit('delete')" />

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
          :disabled="mode !== 'creation'"
          @resized="reflowMasonry"
        />
      </div>
    </div>

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
      v-if="mode !== 'scene'"
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

.static-words {
  background-color: #d7d7d7;
  color: #222;
}

.copy-button:hover,
.copy-button:focus-visible {
  background: rgba(255, 255, 255, 0.7);
}
</style>
