<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import * as Y from 'yjs'
import YAML from 'yaml'
import { useYMapField } from '../lib/yjsComposables'
import { useMode } from '../lib/modeStore'
import type { ThemeData } from '../lib/schema'
import { useWatchWithDebounce } from '../lib/util'

const { mode } = useMode()

const props = defineProps<{
  shard: Y.Map<any> // parent map that contains "quest"
}>()

// Yjs binding
const quest = useYMapField<ThemeData, 'quest'>(props.shard, 'quest', '')

// Local input state (for debouncing)
const localValue = ref(quest.value)

useWatchWithDebounce(quest, localValue, null, autoResize)

const textareaRef = ref<HTMLTextAreaElement | null>(null)

const emit = defineEmits<{
  (e: 'resized'): void
}>()

function autoResize() {
  const el = textareaRef.value
  if (!el) return

  const oldHeight = el.style.height

  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'

  if (el.style.height != oldHeight) emit('resized')
}

onMounted(()=> {
  nextTick(autoResize)
})

function toJson() {
  return {quest: localValue.value}
}

function print() {
  console.log(YAML.stringify(toJson(), null, 2))
}

defineExpose({
  toJson
})
</script>

<template>
  <div class="quest-container">
    <p class="static-words" @click="print">QUEST</p>
    <textarea
      ref="textareaRef"
      v-model="localValue"
      class="quest-input"
      :disabled="mode === 'scene'"
      placeholder="Enter quest..."
      @input="autoResize"
    />
  </div>
</template>

<style scoped>
.quest-container {
  width: 100%;
  position: relative;
  padding: 0.75rem;
}

.static-words {
  width: 100%;
  text-align: center;
  margin-top: 0.2rem;
  margin-bottom: 0.2rem;
  font-size: x-large;
  color: gray;
}

/* Parchment look */
.quest-input {
  width: 100%;
  max-width: 25rem;
  display: block;
  box-sizing: border-box;

  min-height: 4.5rem;
  overflow: hidden;
  resize: none;

  font-size: larger;
  line-height: 1.4;

  padding: 0.75rem 0.85rem;

  border: 0.1rem solid #d6c7a1;
  border-radius: 0.5rem;

  background: linear-gradient(180deg, #f8f1d4 0%, #efe4b0 100%);
  color: #4a3b1f;

  box-shadow:
    inset 0 0 0.5rem rgba(0,0,0,0.08),
    0 0.1rem 0.25rem rgba(0,0,0,0.1);

  outline: none;
}

/* Slight "aged paper" texture feel */
.quest-input::placeholder {
  color: #8a7a4f;
  font-style: italic;
}

/* Disabled = looks like parchment text, NOT a greyed input */
.quest-input:disabled {
  color: #3a2f18;
  background: linear-gradient(180deg, #f4ecd0 0%, #e8ddb0 100%);
  border-color: #cbb98a;

  opacity: 1;              /* prevent default fade */
  cursor: default;
}

/* Remove typical disabled textarea look */
.quest-input:disabled::selection {
  background: rgba(120, 100, 50, 0.2);
}

/* Optional: subtle scroll edges effect */
.quest-container::before,
.quest-container::after {
  content: "";
  position: absolute;
  left: 8px;
  right: 8px;
  height: 6px;
  background: radial-gradient(ellipse at center, rgba(0,0,0,0.15), transparent);
}

.quest-container::before {
  top: 0;
}

.quest-container::after {
  bottom: 0;
}
</style>
