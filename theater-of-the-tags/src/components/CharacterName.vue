<script setup lang="ts">
import * as Y from 'yjs'
import type { HeroData } from '../lib/schema';
import { useMode } from '../lib/modeStore';
import { useYMapField } from '../lib/yjsComposables';
import EditableText from './EditableText.vue';

const { mode } = useMode()

const props = defineProps<{
  shard: Y.Map<any>
}>()

const characterName = useYMapField<HeroData, 'characterName'>(props.shard, 'characterName', '')

function toJson() {
  return { characterName: characterName.value }
}

defineExpose({
  toJson
})

const emit = defineEmits<{
  (e: 'resized'): void,
}>()
</script>

<template>
  <div class="character-name">
    <EditableText
      v-model="characterName"
      tag="h1"
      placeholder="Enter Character Name ..."
      :disabled="mode !== 'creation'"
      @resized="emit('resized')"
    />
  </div>
</template>

<style scoped>
.character-name {
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 1rem;

  box-sizing: border-box;

  color: black;
}
</style>
