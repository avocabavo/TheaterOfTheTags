<script setup lang="ts">
import quill from '../../assets/quill.svg'

const emit = defineEmits<{
  (e: 'edit'): void
}>()
</script>

<template>
  <button
    class="edit-button"
    @click.stop="emit('edit')"
    aria-label="Edit Character Name"
  >
    <img :src="quill" alt="edit" class="icon" />
  </button>
</template>

<style scoped>
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

.icon {
  width: 1.5rem;
  height: 1.5rem;
  pointer-events: none;
}
</style>
