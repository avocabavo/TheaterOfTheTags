<script setup lang="ts">
import quillWhite from '../../assets/quill-white.svg'

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
    <img :src="quillWhite" alt="edit" class="icon" />
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
  padding: 0;
}

.edit-button:hover {
  opacity: 1;
}

.edit-button:active {
  transform: scale(1.2);
}

.icon {
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
