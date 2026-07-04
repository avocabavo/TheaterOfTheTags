<script setup lang="ts">
import { computed, ref } from 'vue'
import { mightOptions, type Might } from '../lib/schema'
import { mightIcon } from '../lib/mightIcons'

const name = ref('')
const might = ref<Might>('origin')

const readyToCreate = computed(()=> name.value.trim())

const emit = defineEmits<{
  (e: 'create', payload: { might: Might, name: string }): void
}>()

function createMightAspect() {
  const trimmedName = name.value.trim()
  if (!trimmedName) return

  emit('create', {
    might: might.value,
    name: trimmedName,
  })
  name.value = ''
}
</script>

<template>
  <div class="new-might-aspect">
    <div class="might-options">
      <label
        v-for="option in mightOptions"
        :key="option"
        class="might-option"
        :title="option"
      >
        <input
          v-model="might"
          type="radio"
          :value="option"
          :aria-label="option"
        >
        <img :src="mightIcon(option)" :alt="option" class="might-icon">
      </label>
    </div>

    <input
      v-model="name"
      class="might-aspect-input"
      placeholder="new might aspect"
      @keydown.enter="createMightAspect"
    >

    <button
      type="button"
      class="add-might-aspect-button"
      :disabled="!readyToCreate"
      @click="createMightAspect"
    >+</button>
  </div>
</template>

<style scoped>
.new-might-aspect {
  box-sizing: border-box;
  width: 25rem;
  max-width: 100%;
  padding: 0.65rem 0.8rem;
  border: 0.25rem solid #777;
  background: #f4f4f4;
  color: #222;

  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.might-options {
  flex: 0 0 auto;
  display: flex;
  gap: 0.35rem;
}

.might-option {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.might-icon {
  width: 1.8rem;
  height: 1.8rem;
  display: block;
}

.might-aspect-input {
  flex: 1 1 auto;
  min-width: 0;
  box-sizing: border-box;
  font-size: larger;
  background: white;
  color: #222;
}

.add-might-aspect-button {
  flex: 0 0 auto;
  aspect-ratio: 1;
  margin-top: 0;
  padding: 0.35rem 0.75rem;
  border: 1px solid currentColor;
  border-radius: 999rem;
  background: transparent;
  color: #222;
  cursor: pointer;
  font-size: large;
}

.add-might-aspect-button:disabled {
  color: gray;
  cursor: not-allowed;
}
</style>
