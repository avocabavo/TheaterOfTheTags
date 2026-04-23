<script setup lang="ts">
import * as Y from 'yjs'
import YAML from 'yaml'
import Tag from './Tag.vue'
import NewTag from './NewTag.vue';
import { useMode } from '../lib/modeStore';
import { useYArray } from '../lib/yjsComposables';
import type { TagNature, TagShard } from '../lib/schema';
import { createTagShard } from '../lib/Tag';
import { nextTick, onBeforeUpdate, ref } from 'vue';
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

function handleCreateTag(data: {name: string, nature: TagNature, scratched: boolean}) {
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
    <p class="static-words" @click="print">BACKPACK</p>
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
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  background: #444;

  border: 0.25rem solid darkgray;

  box-sizing: border-box;
  width: 25rem;
}

.tag-section {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
}
</style>
