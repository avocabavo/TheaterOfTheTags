<script setup lang="ts">
import * as Y from 'yjs'
import YAML from 'yaml'
import { computed, onBeforeUpdate, ref } from 'vue'
import Bubbles from './Bubbles.vue'
import DeleteButton from './buttons/DeleteButton.vue'
import EditableText from './EditableText.vue'
import LooseTag from './LooseTag.vue'
import NewLooseTags from './NewLooseTags.vue'
import Quest from './Quest.vue'
import { useMode } from '../lib/modeStore'
import {
  type FellowshipData,
  type StatusTagShard,
  type TagShard,
} from '../lib/schema'
import { createStatusTagShard, type StatusCreationProps } from '../lib/StatusTag'
import { createTagShard, type TagCreationProps } from '../lib/Tag'
import { useYArray, useYMapField } from '../lib/yjsComposables'
import { useDragDrop, useFieldCollector } from '../lib/util'
import toYamlBlack from '../assets/to-yaml-black.svg'

const { mode } = useMode()

const props = defineProps<{
  shard: Y.Map<any>
}>()

const emit = defineEmits<{
  (e: 'delete'): void
  (e: 'resized'): void
}>()

const fellowshipName = useYMapField<FellowshipData, 'fellowshipName'>(
  props.shard,
  'fellowshipName',
  ''
)

const {
  items: specialImprovements,
  push: pushSpecialImprovement,
  remove: removeSpecialImprovement,
  move: moveSpecialImprovement,
  set: setSpecialImprovement,
} = useYArray<string>(props.shard, 'specialImprovements', ()=> emit('resized'))

const newSpecialImprovement = ref('')

const {
  onDrag: onSpecialImprovementDrag,
  onDrop: onSpecialImprovementDrop,
} = useDragDrop(moveSpecialImprovement, ()=> emit('resized'))

const {
  items: looseTags,
  push: addLooseTag,
  remove: removeLooseTag,
  move: moveLooseTag,
} = useYArray<TagShard | StatusTagShard>(props.shard, 'looseTags', ()=> emit('resized'))

const {
  onDrag: onLooseTagDrag,
  onDrop: onLooseTagDrop,
} = useDragDrop(moveLooseTag, ()=> emit('resized'))

const { fieldRefs, setFieldRef } = useFieldCollector()

const looseTagRefs = ref<any[]>([])

function setLooseTagRef(el: any) {
  if (el) looseTagRefs.value.push(el)
}

onBeforeUpdate(()=> {
  looseTagRefs.value = []
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
    looseTags: looseTagRefs.value.map(lt=> lt.toJson()),
    ...Object.assign(
      {},
      ...fieldRefs.value.map(b=> b.toJson())
    ),
    specialImprovements: specialImprovements.value,
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
  <div class="fellowship">
    <DeleteButton v-if="mode !== 'scene'" @delete="emit('delete')" />

    <div class="fellowship-card">
      <div class="static-words">
        <p>FELLOWSHIP</p>
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
          :disabled="mode !== 'creation'"
          @resized="emit('resized')"
        />
      </div>

      <div class="tag-section">
        <Quest
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
      draggable="true"
      @dragstart="onLooseTagDrag(index)"
      @dragover.prevent
      @drop="onLooseTagDrop(index)"
      @delete="removeLooseTag(index)"
      @resized="emit('resized')"
    />

    <NewLooseTags
      v-if="mode !== 'scene'"
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

  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-start;
}

.fellowship-card {
  box-sizing: border-box;
  border: 0.25rem solid #2c7ea0;
  width: 25rem;
  max-width: 100%;

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

.static-words {
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
}

.fellowship-card .static-words {
  background-color: #62b7dc;
  color: #12384a;
}

.static-words p {
  margin-top: 0.2rem;
  margin-bottom: 0.2rem;
  font-size: x-large;
}

.static-words.small p {
  font-size: large;
}

.copy-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  padding: 0.2rem;
  border: 1px solid currentColor;
  border-radius: 0.25rem;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.copy-button:hover,
.copy-button:focus-visible {
  background: rgba(255, 255, 255, 0.35);
}

.copy-icon {
  width: 1rem;
  height: 1rem;
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
