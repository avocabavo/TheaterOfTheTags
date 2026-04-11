<script setup lang="ts">
import * as Y from 'yjs'
import { ref, onMounted, onUnmounted } from 'vue'
import type { StatusNature } from '../lib/StatusTag'

const props = defineProps<{
  shard: Y.Map<any>
}>()

const name = ref('')
const nature = ref<StatusNature>('helpful')
const limit = ref(5)
const tiers = ref<boolean[]>(Array(limit.value).fill(false))
const exceeded = ref(false)

function syncFromYjs() {
  name.value = props.shard.get('name') ?? ''
  limit.value = props.shard.get('limit') ?? 5
  nature.value = props.shard.get('nature') ?? 'helpful'
  tiers.value = [...(props.shard.get('tiers') ?? Array(limit.value).fill(false))]
  exceeded.value = props.shard.get('exceeded') ?? false
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

function advanceTier(startIndex: number) {
  const updated = [...tiers.value]

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

  if (n >= limit.value) {
    props.shard.set('tiers', Array(limit.value).fill(false))
    return
  }

  const newTiers = Array(limit.value).fill(false)

  for (let i = n; i < limit.value; i++) {
    if (tiers.value[i]) {
      newTiers[i - n] = true
    }
  }

  props.shard.set('tiers', newTiers)
}
</script>

<template>
  <div :class="['status-tag', nature]">
    <h3>{{ name }}</h3>
    <div class="status-row">
      <button
        @click="reduce()"
      >&lt;&lt;</button>
      <button
        v-for="(tier, index) in tiers"
        :key="index"
        type="button"
        class="tier-button"
        @click="advanceTier(index)"
      >
        {{ index + 1 }}{{ tier ? '✖ ' : '' }}
      </button>
    </div>
    <div>{{ exceeded ? "⭐" : "_" }}</div>
  </div>
</template>

<style scoped>
.status-tag {
  padding: 1rem;
  border-radius: 1rem;
}

.status-tag.helpful {
  background-color: lime;
  color: black;
}

.status-tag.hindering {
  background-color: darkred;
  color: white;
}

.tier-button {
  margin-right: 0.5rem;
  padding: 0.4rem 0.6rem;
  border: 1px solid currentColor;
  border-radius: 0.4rem;
  background: transparent;
  color: inherit;
  cursor: pointer;
}
</style>