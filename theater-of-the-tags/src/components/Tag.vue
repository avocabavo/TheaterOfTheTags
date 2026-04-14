<script setup lang="ts">
import type { TagData, TagNature, TagShard } from '../lib/schema'
import { useYMapField } from '../lib/yjsComposables';

const props = defineProps<{
  shard: TagShard
}>()

const name = useYMapField<TagData, 'name'>(props.shard, 'name', '')
const nature = useYMapField<TagData, 'nature'>(props.shard, 'nature', 'power' as TagNature)
const scratched = useYMapField<TagData, 'scratched'>(props.shard, 'scratched', false)

function toggleScratched() {
  scratched.value = !scratched.value
}

const emit = defineEmits<{
  (e: 'delete'): void
}>()
</script>

<template>
  <div :class="['tag', nature]">
    <p
      class="tag-name"
      :class="{ scratched }"
    >
      {{ name }}
    </p>

    <button
      type="button"
      class="scratch-button"
      @click="toggleScratched"
    >///</button>

    <button type="button" @click="emit('delete')">
      delete
    </button>
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

.tag-name.scratched {
  position: relative;
}

.tag-name.scratched::after {
  content: '';
  position: absolute;
  left: 10%;
  right: 10%;
  top: 50%;
  height: 0.2rem;
  background: currentColor;
  transform: rotate(-20deg);
  pointer-events: none;
  opacity: 0.75;
}

.tag-name.scratched::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 45%;
  height: 0.2rem;
  background: currentColor;
  transform: rotate(12deg);
  pointer-events: none;
  opacity: 0.75;
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
