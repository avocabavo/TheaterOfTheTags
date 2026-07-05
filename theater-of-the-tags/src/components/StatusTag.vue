<script setup lang="ts">
import * as Y from 'yjs'
import { computed } from 'vue'
import { useYArray, useYMapField } from '../lib/yjsComposables';
import type { StatusTagData, Usage } from '../lib/schema';
import DeleteButton from './buttons/DeleteButton.vue';
import { useMode } from '../lib/modeStore';
import EditableText from './EditableText.vue';
import invokedBlack from '../assets/invoked-black.svg'
import invokedWhite from '../assets/invoked-white.svg'
import readyBlack from '../assets/ready-black.svg'
import readyWhite from '../assets/ready-white.svg'
import tappedBlack from '../assets/tapped-black.svg'
import tappedWhite from '../assets/tapped-white.svg'
import { tagElementId } from '../lib/domIds'
import { stringifyYaml } from '../lib/yaml'

const { mode, enableNameEditing } = useMode()

const props = defineProps<{
  shard: Y.Map<any>
  nameEditableMode?: 'creation' | 'narrator'
  deletableMode?: 'any-editable' | 'narrator'
}>()

const name = useYMapField<StatusTagData, 'name'>(props.shard, 'name', '')
const nature = useYMapField<StatusTagData, 'nature'>(props.shard, 'nature', 'helpful')
const tiers = useYArray<boolean>(props.shard, 'tiers')
const usage = useYMapField<StatusTagData, 'usage'>(props.shard, 'usage', 'ready' as Usage)
const nameEditableMode = computed(()=> props.nameEditableMode ?? 'creation')
const deletableMode = computed(()=> props.deletableMode ?? 'any-editable')
const canDelete = computed(()=> deletableMode.value === 'narrator'
  ? mode.value === 'narrator'
  : mode.value !== 'scene'
)
const elementId = computed(()=> {
  const uuid = props.shard.get('uuid')
  return typeof uuid === 'string' ? tagElementId(uuid) : undefined
})

function toggleUsage() {
  if (usage.value === 'tapped') return
  usage.value = usage.value === 'ready' ? 'invoked' : 'ready'
}

function usageIcon() {
  const useWhiteIcon = nature.value === 'hindering'

  switch (usage.value) {
    case 'invoked':
      return useWhiteIcon ? invokedWhite : invokedBlack
    case 'tapped':
      return useWhiteIcon ? tappedWhite : tappedBlack
    case 'ready':
    default:
      return useWhiteIcon ? readyWhite : readyBlack
  }
}

function advanceTier(startIndex: number) {
  const arr = tiers.yarray()
  if (!arr) return
  const current = arr.toArray()

  for (let i = startIndex; i < current.length; i++) {
    if (!current[i]) {
      arr.delete(i, 1)
      arr.insert(i, [true])
      return
    }
  }
}

function reduce(n: number = 1) {
  const arr = tiers.yarray()
  if (!arr || n <= 0) return
  const current = arr.toArray()

  if (n >= current.length) {
    arr.delete(0, arr.length)
    arr.insert(0, Array(current.length).fill(false))
    return
  }

  arr.delete(0, n)
  arr.insert(current.length - n, Array(n).fill(false))
}

const emit = defineEmits<{
  (e: 'delete'): void
  (e: 'resized'): void
}>()

function toJson() {
  return {
    name: name.value,
    nature: nature.value,
    tiers: tiers.items.value
  }
}
function toYaml() { return stringifyYaml(toJson())}

function print() {
  console.log(toYaml())
}

async function copyToClipboard() {
  await navigator.clipboard.writeText(toYaml())
}

defineExpose({toJson})
</script>

<template>
  <div :id="elementId" :class="['status-tag', nature]">
    <DeleteButton v-if="canDelete" @delete="emit('delete')" />

    <div class="upper-half">
      <button
        v-if="mode !== 'creation'"
        type="button"
        class="usage-indicator"
        :class="{ tapped: usage === 'tapped' }"
        :aria-label="`Status tag usage: ${usage}`"
        :title="`Usage: ${usage}`"
        @click.stop="toggleUsage"
      >
        <img :src="usageIcon()" :alt="usage" class="usage-icon">
      </button>
      <span class="tiny-static-words">TAG</span>
      <!-- <span class="status-tag-name">{{ name }}</span> -->
      <EditableText
        v-model="name"
        tag="h2"
        class="status-tag-name"
        placeholder="Enter Status Name..."
        :disabled="!enableNameEditing || mode !== nameEditableMode"
        @resized="emit('resized')"
      />
    </div>
    <div class="status-row">
      <button
        type="button"
        class="reduce-button"
        @click="reduce()"
      >≪</button>
      <button
        v-for="(tier, index) in tiers.items.value"
        :key="index"
        type="button"
        class="tier-button"
        @click="advanceTier(Number(index))"
      >
        <span class="tier-label">{{ index + 1 }}</span>
        <span class="tier-marked">{{ tier ? '✖' : '' }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.status-tag {
  box-sizing: border-box;
  position: relative;
  margin: 0.5rem;
  padding: 0.5rem 1.5rem;
  border: 0.2rem solid rgba(0, 0, 0, 0.5);
  border-radius: 3.5rem / 50%;

  width: 100%;
  max-width: 25rem;

  display: flex;
  flex-direction: column;
  align-items: center;
}

.status-tag.helpful {
  background-color: #7d8;
  color: black;
  border-color: rgba(0, 0, 0, 0.5);
}

.status-tag.hindering {
  background-color: darkred;
  color: white;
  border-color: rgba(255, 255, 255, 0.5);
}

.upper-half {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  margin-top: 0;
  margin-bottom: 0.25rem;
}

.usage-indicator {
  flex: 0 0 auto;
  width: 2rem;
  height: 2rem;
  margin-right: 0.4rem;
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
}

.usage-icon {
  width: 100%;
  height: 100%;
  display: block;
  pointer-events: none;
}

.usage-indicator.tapped {
  cursor: default;
}

.tiny-static-words {
  font-size: smaller;
  color: gray;
  margin-right: 0.25rem;
}

.status-tag-name {
  font-size: larger;
}

.status-tag-name :deep(.editable-component) {
  margin: 0.3rem 0 0.6rem 0;
}

.status-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.4rem;
}

.reduce-button {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  font-size: x-large;
  border: none;
  background-color: rgba(0, 0, 0, 0.75);
  color: white;
}

.tier-button {
  padding: 0.4rem 0.6rem;
  border: 1px solid currentColor;
  border-radius: 0.4rem;
  background: transparent;
  color: inherit;
  cursor: pointer;

  width: 2.25rem;
  height: 3.5rem;

  display: flex;
  flex-direction: column;
  align-items: center;

  background: rgba(255, 255, 255, 0.75);
}

.hindering .tier-button {
  background: rgba(0, 0, 0, 0.75);
}

.tier-label {
  font-size: large;
  font-weight: bold;
  color: darkgray;
}

.tier-marked {
  font-size: xx-large;
  margin-top: -0.25rem;
}
</style>
