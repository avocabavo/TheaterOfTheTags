<script setup lang="ts">
const emit = defineEmits<{
  (e: 'delete'): void
}>()
</script>

<template>
  <button
    type="button"
    class="delete-button"
    @click.stop="emit('delete')"
    aria-label="Delete"
  >
    ✖
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

  font-size: 1rem;
  line-height: 1;
  text-align: center;

  cursor: pointer;

  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-button:hover {
  opacity: 1;
}

.delete-button:active {
  transform: scale(1.2);
}
</style>
