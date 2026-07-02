<script setup lang="ts">
import YAML from 'yaml'
import { computed } from 'vue'
import type { TagData, TagNature, TagShard, Usage } from '../lib/schema'
import { useYMapField } from '../lib/yjsComposables';
import { useMode } from '../lib/modeStore';
import DeleteButton from './buttons/DeleteButton.vue';
import EditableText from './EditableText.vue';
import scratchBlack from '../assets/scratch-black.svg'

const { mode } = useMode()

const props = defineProps<{
  shard: TagShard
  nameEditableMode?: 'creation' | 'narrator'
}>()

const name = useYMapField<TagData, 'name'>(props.shard, 'name', '')
const nature = useYMapField<TagData, 'nature'>(props.shard, 'nature', 'power' as TagNature)
const scratched = useYMapField<TagData, 'scratched'>(props.shard, 'scratched', false)
const usage = useYMapField<TagData, 'usage'>(props.shard, 'usage', 'ready' as Usage)
const nameEditableMode = computed(()=> props.nameEditableMode ?? 'creation')

function toggleScratched() {
  scratched.value = !scratched.value
}

function toggleUsage() {
  if (usage.value === 'tapped') return
  usage.value = usage.value === 'ready' ? 'invoked' : 'ready'
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
  <div class="tag" :class="nature" @click="copyToClipboard">
    <DeleteButton v-if="mode !== 'scene'" @delete="emit('delete')" />
    <button
      v-if="mode !== 'creation'"
      type="button"
      class="usage-indicator"
      :class="{
        tapped: usage === 'tapped',
        hidden: scratched && usage === 'ready',
      }"
      :disabled="scratched && usage === 'ready'"
      :aria-label="`Tag usage: ${usage}`"
      :title="`Usage: ${usage}`"
      @click.stop="toggleUsage"
    >
      <span v-if="usage === 'tapped'">🮮</span>
      <span v-else>{{ usage === 'invoked' ? '☑' : '☐' }}</span>
    </button>

    <EditableText
      v-model="name"
      tag="p"
      class="tag-name"
      :class="{ scratched }"
      placeholder="Enter Tag Name ..."
      :disabled="mode !== nameEditableMode"
      @resized="emit('resized')"
    />

    <button
      v-if="nature !== 'weakness'"
      type="button"
      class="scratch-button"
      @click="toggleScratched"
    >
      <img :src="scratchBlack" alt="scratch" class="icon">
    </button>
  </div>
</template>

<style scoped>
.tag {
  box-sizing: border-box;
  position: relative;
  padding: 0.5rem;
  margin: 0.5rem;
  border: 0.2rem solid rgba(0, 0, 0, 0.5);
  border-radius: 2rem / 50%;

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
  border-color: rgba(0, 0, 0, 0.5);
}

.tag.power,
.tag.weakness {
  font-size: larger;
}

.tag.weakness {
  background-color: darkslateblue;
  color: white;
  border-color: rgba(255, 255, 255, 0.5);
}

.tag :deep(p) {
  margin: 0.5rem 0.5rem 0.5rem 1rem;
}

.tag-name {
  flex: 1 1 auto;
  min-width: 0;
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
  flex: 0 0 auto;
  height: 3.25rem;
  width: 3.25rem;
  margin-top: 0;
  margin-left: 0.5rem;
  border: 0.25rem solid currentColor;
  border-radius: 50%;
  background: transparent;
  color: inherit;
  cursor: pointer;

  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.usage-indicator {
  flex: 0 0 auto;
  width: 2rem;
  height: 2rem;
  margin-left: 0.5rem;
  margin-right: 0.5rem;
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
}

.usage-indicator.tapped {
  cursor: default;
}

.usage-indicator.hidden {
  visibility: hidden;
}

.icon {
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
