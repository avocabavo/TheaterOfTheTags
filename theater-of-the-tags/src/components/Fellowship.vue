<script setup lang="ts">
import * as Y from 'yjs'
import { computed, nextTick, onBeforeUpdate, onMounted, ref, watch } from 'vue'
import Bubbles from './Bubbles.vue'
import DeleteButton from './buttons/DeleteButton.vue'
import EditableText from './EditableText.vue'
import LooseTag from './LooseTag.vue'
import NewLooseTags from './NewLooseTags.vue'
import Quest from './Quest.vue'
import { useMode } from '../lib/modeStore'
import {
  DEFAULT_FELLOWSHIP_BACKGROUND_COLOR,
  type FellowshipData,
  type StatusTagShard,
  type TagShard,
} from '../lib/schema'
import { createStatusTagShard, type StatusCreationProps } from '../lib/StatusTag'
import { createTagShard, type TagCreationProps } from '../lib/Tag'
import { useYArray, useYMapField } from '../lib/yjsComposables'
import { useDragDrop, useFieldCollector } from '../lib/util'
import toYamlBlack from '../assets/to-yaml-black.svg'
import Masonry from 'masonry-layout'
import { normalizeCssColor, toColorInputValue } from '../lib/colors'
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

const fellowshipName = useYMapField<FellowshipData, 'fellowshipName'>(
  props.shard,
  'fellowshipName',
  ''
)
const backgroundColor = useYMapField<FellowshipData, 'backgroundColor'>(
  props.shard,
  'backgroundColor',
  DEFAULT_FELLOWSHIP_BACKGROUND_COLOR
)
const fellowshipStyle = computed(()=> ({
  backgroundColor: normalizeCssColor(backgroundColor.value, DEFAULT_FELLOWSHIP_BACKGROUND_COLOR),
}))
const backgroundColorInput = computed({
  get: ()=> toColorInputValue(backgroundColor.value, DEFAULT_FELLOWSHIP_BACKGROUND_COLOR),
  set: (value: string)=> {
    backgroundColor.value = value
  },
})

const {
  items: specialImprovements,
  push: pushSpecialImprovement,
  remove: removeSpecialImprovement,
  move: moveSpecialImprovement,
  set: setSpecialImprovement,
} = useYArray<string>(props.shard, 'specialImprovements', reflowMasonry)

const newSpecialImprovement = ref('')

const {
  onDrag: onSpecialImprovementDrag,
  onDrop: onSpecialImprovementDrop,
} = useDragDrop(moveSpecialImprovement, reflowMasonry)

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

const { fieldRefs, setFieldRef } = useFieldCollector()

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

function createSpecialImprovement() {
  const trimmed = newSpecialImprovement.value.trim()
  if (!trimmed) return

  pushSpecialImprovement(trimmed)
  newSpecialImprovement.value = ''
}

function handleCreateLooseTag(data: TagCreationProps) {
  addLooseTag(createTagShard(data))
}

function handleCreateLooseStatus(data: StatusCreationProps) {
  addLooseTag(createStatusTagShard(data))
}

const readyToCreateSpecialImprovement = computed(()=> newSpecialImprovement.value.trim())

function toJson() {
  return {
    fellowshipName: fellowshipName.value,
    backgroundColor: backgroundColor.value,
    looseTags: looseTagRefs.value.map(lt=> lt.toJson()),
    ...Object.assign(
      {},
      ...fieldRefs.value.map(b=> b.toJson())
    ),
    specialImprovements: specialImprovements.value,
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
  <div ref="grid" class="fellowship" :style="fellowshipStyle">
    <div class="fellowship-card grid-item grid-sizer">
      <DeleteButton v-if="mode !== 'scene'" @delete="emit('delete')" />

      <div class="static-words">
        <p>FELLOWSHIP</p>
        <input
          v-if="mode == 'creation'"
          v-model="backgroundColorInput"
          type="color"
          class="background-color-input"
          aria-label="Set fellowship background color"
          title="Set fellowship background color"
        >
        <button
          type="button"
          class="copy-button"
          aria-label="Copy fellowship YAML"
          title="Copy fellowship YAML"
          @click="copyToClipboard"
        >
          <img :src="toYamlBlack" alt="" class="copy-icon" aria-hidden="true">
        </button>
      </div>

      <div class="fellowship-name">
        <EditableText
          v-model="fellowshipName"
          tag="h1"
          placeholder="Enter Fellowship Name ..."
          :disabled="!enableNameEditing || mode !== 'creation'"
          @resized="reflowMasonry"
        />
      </div>

      <div class="quest-section">
        <Quest
          class="fellowship-quest"
          :shard="shard"
          :ref="setFieldRef"
          @resized="reflowMasonry"
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

      <div class="special-improvements">
        <div class="small static-words">
          <p>SPECIAL IMPROVEMENTS</p>
        </div>
        <div
          class="special-improvement-box"
          v-for="(improvement, index) in specialImprovements"
          :key="`${improvement}-${index}`"
          draggable="true"
          @dragstart="onSpecialImprovementDrag(index)"
          @dragover.prevent
          @drop="onSpecialImprovementDrop(index)"
        >
          <DeleteButton v-if="mode === 'narrator'" @delete="removeSpecialImprovement(index)" />
          <EditableText
            :model-value="improvement"
            @update:modelValue="val => setSpecialImprovement(index, val)"
            @resized="reflowMasonry"
            tag="p"
            :disabled="mode !== 'narrator'"
          />
        </div>
        <div class="special-improvement-box">
          <input
            class="special-improvement-input"
            v-model="newSpecialImprovement"
            @keydown.enter="createSpecialImprovement"
            placeholder="new special improvement"
          >
          <button
            type="button"
            class="add-special-improvement-button"
            @click="createSpecialImprovement"
            :disabled="!readyToCreateSpecialImprovement"
          >+</button>
        </div>
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
.fellowship {
  position: relative;
  border: 3px solid #1f5f7a;
  width: 100%;
  padding: 1rem;
  scroll-margin-top: 5.5rem;
}

.fellowship > * {
  margin-bottom: 16px;
}

.grid-sizer,
.grid-item {
  width: 25rem;
  max-width: 100%;
}

.fellowship-card {
  --fellowship-banner-bg: #62b7dc;
  --fellowship-banner-fg: #12384a;

  box-sizing: border-box;
  border: 0.25rem solid #2c7ea0;

  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;

  background: #bfe9ff;
}

.fellowship-name {
  width: 100%;
  display: flex;
  justify-content: center;
  color: #12384a;
}

.fellowship-name :deep(.editable-component) {
  text-align: center;
}

.tag-section {
  box-sizing: border-box;
  width: 100%;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  align-items: center;
}

.quest-aim {
  width: 100%;
  display: flex;
  align-items: baseline;
  justify-content: space-around;
}

.fellowship-card .static-words {
  background-color: var(--fellowship-banner-bg);
  color: var(--fellowship-banner-fg);
}

.quest-section {
  box-sizing: border-box;
  width: 100%;
  padding: 0;
}

.fellowship-quest {
  box-sizing: border-box;
  width: 100%;
  margin: 0;
  padding: 0;
}

.fellowship-quest :deep(.static-words) {
  box-sizing: border-box;
  width: 100%;
  margin-left: 0;
  margin-right: 0;
  margin-top: 0;
  margin-bottom: 0.5rem;
  padding: 0.2rem 0;
  background: var(--fellowship-banner-bg);
  color: var(--fellowship-banner-fg);
  font-size: large;
}

.special-improvements {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
}

.special-improvement-box {
  position: relative;
  padding: 0.25rem 1rem;
  margin: 0.25rem;
  border: 0.2rem solid rgba(18, 56, 74, 0.5);
  border-radius: 999rem;
  box-sizing: border-box;

  max-width: 25rem;
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: 0.5rem;
}

.special-improvement-box :deep(p) {
  margin: 0.25rem;
  color: #12384a;
}

.special-improvement-input {
  width: 100%;
  box-sizing: border-box;
  font-size: larger;
  background: rgba(255, 255, 255, 0.8);
  color: #12384a;
}

.add-special-improvement-button {
  aspect-ratio: 1;
  margin-top: 0;
  margin-left: 0.5rem;
  padding: 0.35rem 0.75rem;
  border: 1px solid currentColor;
  border-radius: 999rem;
  background: transparent;
  color: #12384a;
  cursor: pointer;

  font-size: large;
}

.add-special-improvement-button:disabled {
  color: gray;
  cursor: not-allowed;
}
</style>
