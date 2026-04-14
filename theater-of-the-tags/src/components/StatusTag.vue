<script setup lang="ts">
import * as Y from 'yjs'
import { useYArray, useYMapField } from '../lib/yjsComposables';
import type { StatusTagData } from '../lib/schema';

const props = defineProps<{
  shard: Y.Map<any>
}>()

const name = useYMapField<StatusTagData, 'name'>(props.shard, 'name', '')
const nature = useYMapField<StatusTagData, 'nature'>(props.shard, 'nature', 'helpful')
const tiers = useYArray<boolean>(props.shard, 'tiers')

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
}>()
</script>

<template>
  <div :class="['status-tag', nature]">
    <p class="upper-half">
      <span class="the-word-tag">TAG</span>
      <span class="status-tag-name">{{ name }}</span>
    </p>
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

    <button type="button" @click="emit('delete')">
      delete
    </button>
  </div>
</template>

<style scoped>
.status-tag {
  margin: 0.5rem;
  padding: 0.5rem 1.5rem;
  border-radius: 9999rem;

  display: flex;
  flex-direction: column;
  align-items: center;
}

.status-tag.helpful {
  background-color: #7d8;
  color: black;
}

.status-tag.hindering {
  background-color: darkred;
  color: white;
}

.upper-half {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  margin-top: 0;
  margin-bottom: 0.25rem;
}

.the-word-tag {
  font-size: smaller;
  color: gray;
  margin-right: 0.25rem;
}

.status-tag-name {
  font-size: larger;
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

  width: 2rem;
  height: 3.5rem;

  display: flex;
  flex-direction: column;
  align-items: center;

  background: rgba(255, 255, 255, 0.75);
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