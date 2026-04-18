<script setup lang="ts">
import * as Y from 'yjs'
import { useYMapField } from '../lib/yjsComposables'
import { useMode } from '../lib/modeStore'

const { mode } = useMode()

const props = defineProps<{
  shard: Y.Map<any>
  field: string      // key in the map
  max: number
  name: string
}>()

// Yjs binding
const value = useYMapField<any, any>(props.shard, props.field, 0)

function setValue(n: number) {
  if (mode.value !== 'narrator') return
  if (value.value < n) value.value = n
  else value.value = n - 1
}

function toJson() {
  return {[props.field]: value.value}
}

function print() {
  console.log(toJson())
}

defineExpose({
  toJson
})
</script>

<template>
  <div class="bubble-field">
    <div class="buttons">
      <button
        v-for="n in max"
        :key="n"
        class="circle"
        :class="{ filled: n <= value }"
        :disabled="mode !== 'narrator'"
        @click="setValue(n)"
      />
    </div>

    <div class="label" @click="print">
      {{ name }}
    </div>
  </div>
</template>

<style scoped>
.bubble-field {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
}

/* Row of buttons */
.buttons {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

/* Circle buttons */
.circle {
  width: 1.2rem;
  height: 1.2rem;
  border-radius: 50%;

  border: 2px solid #333;
  background: transparent;

  cursor: pointer;
  transition: all 0.1s ease;
}

/* Filled state */
.circle.filled {
  background: #666;
}

/* Hover effect */
.circle:hover:not(:disabled) {
  transform: scale(1.1);
}

/* Disabled (scene mode) */
button:disabled {
  cursor: default;
  opacity: 1; /* prevent fade */
}

/* Label */
.label {
  font-size: 0.8rem;
  color: #444;
  text-align: center;
}
</style>