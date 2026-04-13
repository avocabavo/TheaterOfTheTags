<script setup lang="ts">
import * as Y from 'yjs'
import { ref, onMounted, onUnmounted } from 'vue'
import type { StatusNature } from '../lib/StatusTag'
import { LIMIT } from '../lib/StatusTag'
import { useYArray, useYMapField } from '../lib/yjsComposables';

const props = defineProps<{
  shard: Y.Map<any>
}>()

const name = useYMapField(props.shard, 'name', '')
const nature = useYMapField(props.shard, 'nature', 'helpful')
const tiers = useYArray<boolean>(props.shard, 'tiers')

function advanceTier(startIndex: number) {
  const updated = [...tiers.yarray()]

  for (let i = startIndex; i < updated.length; i++) {
    if (!updated[i]) {
      updated[i] = true
      props.shard.set('tiers', updated)
      return
    }
  }

  props.shard.set('exceeded', true)
}

function reduce(n: number = 1) {
  if (n <= 0) return

  if (n >= LIMIT) {
    props.shard.set('tiers', Array(LIMIT).fill(false))
    return
  }

  const newTiers = Array(LIMIT).fill(false)

  for (let i = n; i < LIMIT; i++) {
    if (tiers.value[i]) {
      newTiers[i - n] = true
    }
  }

  props.shard.set('tiers', newTiers)
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
        v-for="(tier, index) in tiers"
        :key="index"
        type="button"
        class="tier-button"
        @click="advanceTier(index)"
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