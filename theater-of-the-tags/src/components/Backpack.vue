<script setup lang="ts">
import * as Y from 'yjs'
import YAML from 'yaml'
import Tag from './Tag.vue'
import NewTag from './NewTag.vue';
import { useMode } from '../lib/modeStore';
import { useYArray } from '../lib/yjsComposables';
import type { TagShard } from '../lib/schema';
import { createTagShard, type TagCreationProps } from '../lib/Tag';
import { onBeforeUpdate, ref } from 'vue';
import { useDragDrop } from '../lib/util';

const { mode } = useMode()

const props = defineProps<{
  shard: Y.Map<any>
}>()

const {
  items: backpackTags,
  push: addBackpackTag,
  remove: removeBackpackTag,
  move: moveBackpackTag,
} = useYArray<TagShard>(
  props.shard,
  'backpack',
  ()=> emit('resized'),
)

const emit = defineEmits<{
  (e: 'resized'): void,
}>()

function handleCreateTag(data: TagCreationProps) {
  const newShard = createTagShard(data)
  addBackpackTag(newShard)
}

const backpackTagRefs = ref<any[]>([])

function setBackpackTagRef(el: any) {
  if (el) backpackTagRefs.value.push(el)
}

onBeforeUpdate(()=> {
  backpackTagRefs.value = []
})

const {
  onDrag,
  onDrop,
} = useDragDrop(moveBackpackTag, ()=> emit('resized'))

function toJson() {
  return backpackTags.value.map(t=> t.toJSON())
}

function print() {
  console.log(YAML.stringify(toJson(), null, 2))
}

defineExpose({
  toJson
})
</script>

<template>
  <div class="backpack">
    <div class="static-words">
      <p @click="print">BACKPACK</p>
    </div>
    <div class="tag-section">
      <Tag
        v-for="(tag, index) in backpackTags"
        :key="tag.get('uuid')"
        :ref="setBackpackTagRef"
        :shard="tag"
        draggable="true"
        @dragstart="onDrag(index)"
        @dragover.prevent
        @drop="onDrop(index)"
        @delete="removeBackpackTag(index)"
        @resized="emit('resized')"
      />
      <NewTag
        v-if="mode !== 'scene'"
        nature="power"
        @create="handleCreateTag"
      />
      <NewTag
        v-if="mode !== 'scene'"
        nature="weakness"
        @create="handleCreateTag"
      />
    </div>
  </div>
</template>

<style scoped>
.backpack {
  box-sizing: border-box;
  border: 0.25rem solid darkgray;
  width: 25rem;

  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;

  background: #444;
}

.static-words {
  justify-content: space-around;
}

.backpack .static-words {
  background-color: #222;
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
</style>
