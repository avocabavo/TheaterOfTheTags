<script setup lang="ts">
import { computed, ref } from 'vue';
import type { StatusNature } from '../lib/schema';



const props = defineProps<{
  nature: StatusNature
}>()

const emit = defineEmits<{
  (e: 'create', payload: { name: string; nature: StatusNature; tiers?: boolean[] }): void
}>()

const name = ref('')

function createStatus() {
  const trimmed = name.value.trim()
  if (!trimmed) return

  emit('create', {
    name: trimmed,
    nature: props.nature,
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
  border-radius: 9999rem;

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
</style>