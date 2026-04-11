<script setup lang="ts">
import * as Y from 'yjs'
import { ref, onMounted, onUnmounted } from 'vue'
import type { TagNature } from '../lib/Tag'

const props = defineProps<{
  shard: Y.Map<any>
}>()

const name = ref('')
const nature = ref<TagNature>('power')
const scratched = ref(false)

function syncFromYjs() {
  name.value = props.shard.get('name') ?? ''
  nature.value = props.shard.get('nature') ?? 'power'
  scratched.value = props.shard.get('scratched') ?? false
}

const observer = ()=> {
  syncFromYjs()
}
onMounted(()=> {
  syncFromYjs()
  props.shard.observe(observer)
})
onUnmounted(()=> {
  props.shard.unobserve(observer)
})

function toggleScratched() {
  props.shard.set('scratched', !scratched.value)
}
</script>

<template>
  <div :class="['tag', nature]">
    <h3 :class="{ scratched }">
      {{ name }}
    </h3>

    <button
      type="button"
      class="scratch-button"
      @click="toggleScratched"
    >=//=</button>
  </div>
</template>

<style scoped>
.tag {
  padding: 1rem;
  border: none;
  border-radius: 100rem;
}

.tag.theme {
  font-size: larger;
}

.tag.theme,
.tag.theme {
  background-color: gold;
  color: black;
}

.tag.weakness {
  background-color: darkslateblue;
  color: white;
}

.scratched {
  text-decoration: line-through;
}

.scratch-button {
  margin-top: 0.5rem;
  padding: 0.35rem 0.75rem;
  border: 1px solid currentColor;
  border-radius: 999rem;
  background: transparent;
  color: inherit;
  cursor: pointer;
}
</style>