<script setup lang="ts">
import YAML from 'yaml'
import type { TagData, TagNature, TagShard } from '../lib/schema'
import { useYMapField } from '../lib/yjsComposables';
import { useMode } from '../lib/modeStore';
import DeleteButton from './buttons/DeleteButton.vue';
import EditableText from './EditableText.vue';

const { mode } = useMode()

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
  (e: 'delete'): void,
  (e: 'resized'): void,
}>()

function toJson() {
  return {
    name: name.value,
    nature: nature.value,
    scratched: scratched.value,
  }
}
function toYaml() { return YAML.stringify(toJson(), null, 2) }

function print() {
  console.log(toYaml())
}

async function copyToClipboard() {
  await navigator.clipboard.writeText(toYaml())
}

defineExpose({
  toJson
})
</script>

<template>
  <div :class="['tag', nature]" @click="copyToClipboard">
    <DeleteButton v-if="mode !== 'scene'" @delete="emit('delete')" />
    <div v-if="nature === 'weakness'" class="weakness-indicator">🮮</div>

    <EditableText
      v-model="name"
      tag="p"
      class="tag-name"
      :class="{ scratched }"
      placeholder="Enter Tag Name ..."
      :disabled="mode !== 'creation'"
      @resized="emit('resized')"
    />

    <button
      v-if="nature !== 'weakness'"
      type="button"
      class="scratch-button"
      @click="toggleScratched"
    >///</button>
  </div>
</template>

<style scoped>
.tag {
  position: relative;
  padding: 0.5rem;
  margin: 0.5rem;
  border: 0.2rem solid rgba(0, 0, 0, 0.5);
  border-radius: 999rem;

  width: 100%;
  max-width: 25rem;

  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.tag.primary {
  font-size: xx-large;
}

.tag.primary,
.tag.power {
  background-color: gold;
  color: black;
}

.tag.power,
.tag.weakness {
  font-size: larger;
}

.tag.weakness {
  background-color: darkslateblue;
  color: white;
}

.tag :deep(p) {
  margin: 0.5rem 0.5rem 0.5rem 1rem;
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
  margin-left: 0.5rem;
  padding: 0.35rem 0.75rem;
  border: 1px solid currentColor;
  border-radius: 999rem;
  background: transparent;
  color: inherit;
  cursor: pointer;

  font-size: xx-large;
}

.weakness-indicator {
  margin-left: 0.5rem;
  margin-right: 0.5rem;
}
</style>
