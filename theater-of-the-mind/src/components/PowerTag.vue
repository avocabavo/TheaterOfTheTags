<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

const props = defineProps<{
  ymap: Y.Map<any>
  field: string
}>()

const localValue = ref(0)

const syncFromYjs = () => {
  localValue.value = props.ymap.get(props.field) ?? 0
}

const observer = () => {
  syncFromYjs()
}

onMounted(() => {
  if (!props.ymap.has(props.field)) {
    props.ymap.set(props.field, 0)
  }

  syncFromYjs()
  props.ymap.observe(observer)
})

onUnmounted(() => {
  props.ymap.unobserve(observer)
})

const value = computed(() => localValue.value)

function increment() {
  props.ymap.set(props.field, value.value + 1)
}

function decrement() {
  props.ymap.set(props.field, value.value - 1)
}
</script>

<template>
  <div class="power-tag">
    <p class="tag-name">{{ field }}</p>
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