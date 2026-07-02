<script setup lang="ts">
import bonfireWhite from '../../assets/bonfire-white.svg'
import { useMode } from '../../lib/modeStore'

const { enableDeleting } = useMode()

const emit = defineEmits<{
  (e: 'delete'): void
}>()
</script>

<template>
  <button
    v-if="enableDeleting"
    type="button"
    class="delete-button"
    @click.stop="emit('delete')"
    aria-label="Delete"
  >
    <img :src="bonfireWhite" alt="delete" class="icon">
  </button>
</template>

<style scoped>
button {
  position: absolute;
  top: -1rem;
  right: -1rem;

  width: 2rem;
  height: 2rem;

  border-radius: 50%;
  border: 0.25rem solid black;

  background: #555;
  color: white;

  opacity: 0.6;

  cursor: pointer;

  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.delete-button:hover {
  opacity: 1;
}

.delete-button:active {
  transform: scale(1.2);
}

.icon {
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
