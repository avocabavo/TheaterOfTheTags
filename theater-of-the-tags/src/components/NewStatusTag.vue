<script setup lang="ts">
import { computed, ref } from 'vue';
import type { StatusNature } from '../lib/schema';



const props = defineProps<{
  nature: StatusNature
}>()

const emit = defineEmits<{
  (e: 'create', payload: { name: string; nature: StatusNature; tiers?: boolean[]; initialTier?: number }): void
}>()

const name = ref('')

function createStatus() {
  const trimmed = name.value.trim()
  if (!trimmed) return

  emit('create', {
    name: trimmed,
    nature: props.nature,
    initialTier: 2,
  })

  name.value = ''
}

const readyToCreate = computed(()=> name.value.trim())
</script>

<template>
  <div class="status-tag new-status-tag" :class="nature">
    <input
      v-model="name"
      class="status-name-input"
      placeholder="add status..."
      @keydown.enter="createStatus"
    />

    <button
      type="button"
      class="add-button"
      @click="createStatus"
      :disabled="!readyToCreate"
    >+</button>
  </div>
</template>

<style scoped>
.status-tag {
  position: relative;
  margin: 0.5rem;
  padding: 0.5rem 1.5rem;
  border: 0.2rem solid rgba(0, 0, 0, 0.5);
  border-radius: 9999rem;

  width: 100%;
  max-width: 25rem;

  display: flex;
  flex-direction: column;
  align-items: center;
}

.status-tag.helpful {
  background-color: #7d8;
  color: black;
}

.status-tag.hindering {
  background-color: darkred;
  color: white;
}

.new-status-tag {
  opacity: 0.8;
  border-style: dashed;
}

.status-name-input {
  width: 100%;
  box-sizing: border-box;
  font-size: larger;
  background: rgba(255, 255, 255, 0.75);
  color: black;
}
</style>