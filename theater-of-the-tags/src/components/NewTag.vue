<script setup lang="ts">
import { computed, ref } from 'vue'
import type { TagNature } from '../lib/schema'
import type { TagCreationProps } from '../lib/Tag';
import newTagBlack from '../assets/new-tag-black.svg'

const props = defineProps<{
  nature: TagNature
}>()

const emit = defineEmits<{
  (e: 'create', payload: TagCreationProps): void
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
  <div class="tag new-tag" :class="nature">
    <div v-if="nature === 'weakness'" class="weakness-indicator">🮮</div>

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
    >
      <img :src="newTagBlack" alt="new tag" class="icon">
    </button>
  </div>
</template>

<style scoped>
.tag {
  box-sizing: border-box;
  position: relative;
  padding: 0.5rem;
  margin: 0.5rem;
  border: 0.2rem solid rgba(0, 0, 0, 0.5);
  border-radius: 2rem / 50%;

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
  flex: 0 0 auto;
  height: 3.25rem;
  width: 3.25rem;
  margin-top: 0;
  margin-left: 0.5rem;
  border: 0.25rem solid currentColor;
  border-radius: 50%;
  background: transparent;
  color: inherit;
  cursor: pointer;

  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.tag-name-input {
  flex: 1 1 auto;
  min-width: 0;
  box-sizing: border-box;
  font-size: larger;
  background: rgba(255, 255, 255, 0.75);
  color: black;
}

.new-tag {
  opacity: 0.8;
  border-style: dashed;
}

.weakness-indicator {
  flex: 0 0 auto;
  margin-left: 0.5rem;
  margin-right: 0.5rem;
}

.icon {
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
