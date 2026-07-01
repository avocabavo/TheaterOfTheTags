<script setup lang="ts">
import * as Y from 'yjs'
import YAML from 'yaml'
import { onBeforeUpdate, ref } from 'vue'
import DeleteButton from './buttons/DeleteButton.vue'
import EditableText from './EditableText.vue'
import LooseTag from './LooseTag.vue'
import NewLooseTags from './NewLooseTags.vue'
import { useMode } from '../lib/modeStore'
import {
  type SituationData,
  type StatusTagShard,
  type TagShard,
} from '../lib/schema'
import { createStatusTagShard, type StatusCreationProps } from '../lib/StatusTag'
import { createTagShard, type TagCreationProps } from '../lib/Tag'
import { useYArray, useYMapField } from '../lib/yjsComposables'
import { useDragDrop } from '../lib/util'
import toYamlBlack from '../assets/to-yaml-black.svg'

const { mode } = useMode()

const props = defineProps<{
  shard: Y.Map<any>
}>()

const emit = defineEmits<{
  (e: 'delete'): void
  (e: 'resized'): void
}>()

const situationName = useYMapField<SituationData, 'situationName'>(
  props.shard,
  'situationName',
  ''
)

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

const looseTagRefs = ref<any[]>([])

function setLooseTagRef(el: any) {
  if (el) looseTagRefs.value.push(el)
}

onBeforeUpdate(()=> {
  looseTagRefs.value = []
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
  <div class="situation">
    <DeleteButton v-if="mode !== 'scene'" @delete="emit('delete')" />

    <div class="situation-card">
      <div class="static-words">
        <p>SITUATION</p>
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
          @resized="emit('resized')"
        />
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
.situation {
  position: relative;
  border: 3px solid #777;
  width: 100%;
  padding: 1rem;
  scroll-margin-top: 5.5rem;

  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-start;
}

.situation-card {
  box-sizing: border-box;
  border: 0.25rem solid #777;
  width: 25rem;
  max-width: 100%;

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
