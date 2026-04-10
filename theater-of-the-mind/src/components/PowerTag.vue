<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { powerTags } from '../lib/yjs'

const props = defineProps<{
  id: string
}>()

const localValue = ref(0)

const syncFromYjs = () => {
  localValue.value = powerTags.get(props.id) ?? 0
}

const observer = () => {
  syncFromYjs()
}

onMounted(() => {
  if (!powerTags.has(props.id)) {
    powerTags.set(props.id, 0)
  }

  syncFromYjs()
  powerTags.observe(observer)
})

onUnmounted(() => {
  powerTags.unobserve(observer)
})

const value = computed(() => localValue.value)

function increment() {
  powerTags.set(props.id, value.value + 1)
}

function decrement() {
  powerTags.set(props.id, value.value - 1)
}
</script>

<template>
  <div class="power-tag">
    <p class="tag-name">{{ id }}</p>
    <hr style="width: 100%;">
    <div class="int-adjuster">
      <button @click="decrement">−</button>
      <span>{{ value }}</span>
      <button @click="increment">+</button>
    </div>
  </div>
</template>

<style scoped>
.power-tag {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;

  border: 1px solid #ccc;
  border-radius: 8px;
  width: 10rem;
  margin: 1rem;
}

.tag-name {
  margin: 0.3rem;
}

.int-adjuster {
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px;
}

button {
  width: 32px;
  height: 32px;
  font-size: 18px;
  cursor: pointer;
}

span {
  min-width: 24px;
  text-align: center;
  font-weight: bold;
}
</style>