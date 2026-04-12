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
    <p :class="{'tag-name': true, scratched}">
      {{ name }}
    </p>

    <button
      type="button"
      :class="{'scratch-button': true, scratched: !scratched}"
      @click="toggleScratched"
    >///</button>
  </div>
</template>

<style scoped>
.tag {
  padding: 0.5rem;
  margin: 1rem;
  border: none;
  border-radius: 100rem;

  display: flex;
  align-items: center;
}

.tag.theme {
  font-size: larger;
}

.tag.theme,
.tag.power {
  background-color: gold;
  color: black;
}

.tag.weakness {
  background-color: darkslateblue;
  color: white;
}

.tag-name {
  margin: 0.5rem;
}

.scratched {
  text-decoration: line-through;
}

.scratch-button {
  aspect-ratio: 1;
  margin-top: 0;
  padding: 0.35rem 0.75rem;
  border: 1px solid currentColor;
  border-radius: 999rem;
  background: transparent;
  color: inherit;
  cursor: pointer;

  font-size: xx-large;
}
</style>