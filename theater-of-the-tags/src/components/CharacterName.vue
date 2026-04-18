<script setup lang="ts">
import * as Y from 'yjs'
import type { HeroData } from '../lib/schema';
import { useMode } from '../lib/modeStore';
import { useYMapField } from '../lib/yjsComposables';
import { nextTick, ref } from 'vue';
import { useWatchWithDebounce } from '../lib/util';

const { mode } = useMode()

const props = defineProps<{
  shard: Y.Map<any>
}>()

const characterName = useYMapField<HeroData, 'characterName'>(props.shard, 'characterName', '')

const localValue = ref(characterName.value)

useWatchWithDebounce(characterName, localValue)

const isEditing = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

function startEditing() {
  if (mode.value === 'scene') return

  isEditing.value = true

  nextTick(()=> {
    const el = inputRef.value
    if (!el) return

    el.focus()
    el.select()
  })
}

function stopEditing() {
  isEditing.value = false
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    stopEditing()
  }
}

function toJson() {
  return { characterName: localValue.value }
}

defineExpose({
  toJson
})
</script>

<template>
  <div class="character-name">
    <input
      v-if="isEditing"
      ref="inputRef"
      v-model="localValue"
      @keydown="handleKeydown"
      @blur="stopEditing"
      placeholder="Enter Character Name"
    />
    <h1 v-else>
      {{ characterName }}
      <button
        v-if="mode !== 'scene'"
        class="edit-button"
        @click="startEditing"
        title="Edit Character Name"
      >
        ✎
      </button>
    </h1>
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

.character-name h1 {
  position: relative;
}

.character-name input {
  width: 80%;
  box-sizing: border-box;
  font-size: 2rem;
  font-weight: bold;
  text-align: center;
  outline: none;
  background: rgba(255, 255, 255, 0.25);

  border-bottom: 2px solid #ccc;
}

.edit-button {
  position: absolute;
  border: 0.25rem solid black;
  border-radius: 50%;
  top: -1rem;
  left: -1rem;

  width: 2rem;
  height: 2rem;

  text-align: center;
  background: #555;
  color: white;

  cursor: pointer;

  font-size: 1.5rem;
  opacity: 0.6;

  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-button:hover {
  opacity: 1;
}

.edit-button:active {
  transform: scale(1.2);
}
</style>