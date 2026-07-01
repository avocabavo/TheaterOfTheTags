<script setup lang="ts">
import { computed, ref } from 'vue';
import type { StatusNature } from '../lib/schema';
import type { StatusCreationProps } from '../lib/StatusTag';



const props = defineProps<{
  nature: StatusNature
}>()

const emit = defineEmits<{
  (e: 'create', payload: StatusCreationProps): void
}>()

const name = ref('')

function createStatus(initialTier?: number) {
  const trimmed = name.value.trim()
  if (!trimmed) return

  const data: StatusCreationProps = {
    name: trimmed,
    nature: props.nature,
  }
  if (initialTier != null) {
    data.initialTier = initialTier
  }

  emit('create', data)

  name.value = ''
}

const readyToCreate = computed(()=> name.value.trim())
</script>

<template>
  <div class="status-tag new-status-tag" :class="nature">
    <div class="upper-half">
      <span class="tiny-static-words">TAG</span>
      <input
        v-model="name"
        class="status-name-input"
        placeholder="add status..."
        @keydown.enter="createStatus()"
      />
    </div>

    <div class="status-row">
      <button
        v-for="tier in [1, 2, 3, 4, 5, 6]"
        :key="tier"
        type="button"
        class="initial-tier-button"
        @click="createStatus(tier)"
        :disabled="!readyToCreate"
      >
        <span class="tier-label">{{ tier }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.status-tag {
  box-sizing: border-box;
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
  border-color: rgba(0, 0, 0, 0.5);
}

.status-tag.hindering {
  background-color: darkred;
  color: white;
  border-color: rgba(255, 255, 255, 0.5);
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

.upper-half {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  margin-top: 0;
  margin-bottom: 0.25rem;
}

.tiny-static-words {
  font-size: smaller;
  color: gray;
  margin-right: 0.25rem;
}

.status-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.4rem;
}

.initial-tier-button {
  padding: 0.4rem 0.6rem;
  border: 1px solid currentColor;
  border-radius: 0.4rem;
  background: transparent;
  color: inherit;
  cursor: pointer;

  width: 2.25rem;
  height: 2.25rem;

  display: flex;
  flex-direction: column;
  align-items: center;

  background: rgba(255, 255, 255, 0.75);
}

.hindering .initial-tier-button {
  background: rgba(0, 0, 0, 0.75);
}

.tier-label {
  font-size: large;
  font-weight: bold;
  color: darkgray;
}
</style>
