<script setup lang="ts">
import { computed, ref } from 'vue'
import type { TagData, TagNature } from '../lib/schema'

const props = defineProps<{
  nature: TagNature
}>()

const emit = defineEmits<{
  (e: 'create', payload: { name: string; nature: TagNature; scratched: boolean}): void
}>()

const name = ref('')

function createTag() {
  const trimmed = name.value.trim()
  if (!trimmed) return

  emit('create', {
    name: trimmed,
    nature: props.nature,
    scratched: false,
  })

  name.value = ''
}

const readyToCreate = computed(()=> name.value.trim())
</script>

<template>
  <div :class="['tag', nature, 'new-tag']">
    <input
      v-model="name"
      class="tag-name-input"
      placeholder="add tag..."
      @keydown.enter="createTag"
    />

    <button
      type="button"
      class="add-button"
      @click="createTag"
      :disabled="!readyToCreate"
    >+</button>
  </div>
</template>

<style scoped>
.tag {
  position: relative;
  padding: 0.5rem;
  margin: 0.5rem;
  border: 0.2rem solid rgba(0, 0, 0, 0.5);
  border-radius: 999rem;

  width: 100%;
  max-width: 25rem;

  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.tag.primary {
  font-size: xx-large;
}

.tag.primary,
.tag.power {
  background-color: gold;
  color: black;
}

.tag.power,
.tag.weakness {
  font-size: larger;
}

.tag.weakness {
  background-color: darkslateblue;
  color: white;
}

.tag-name {
  margin: 0.5rem;
}

.tag-name.scratched {
  position: relative;
}

.tag-name.scratched::after {
  content: '';
  position: absolute;
  left: 10%;
  right: 10%;
  top: 50%;
  height: 0.2rem;
  background: currentColor;
  transform: rotate(-20deg);
  pointer-events: none;
  opacity: 0.75;
}

.tag-name.scratched::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 45%;
  height: 0.2rem;
  background: currentColor;
  transform: rotate(12deg);
  pointer-events: none;
  opacity: 0.75;
}

.scratch-button, .add-button {
  aspect-ratio: 1;
  margin-top: 0;
  padding: 0.35rem 0.75rem;
  border: 1px solid currentColor;
  border-radius: 999rem;
  background: transparent;
  color: inherit;
  cursor: pointer;

  font-size: xx-large;
}

.tag-name-input {
  font-size: larger;
  background: rgba(255, 255, 255, 0.75);
  color: black;
}

.new-tag {
  opacity: 0.8;
  border-style: dashed;
}
</style>
