<script setup lang="ts">
import * as Y from 'yjs'
import { computed, onMounted, onUnmounted, ref } from 'vue'

import NavigationBar from './components/NavigationBar.vue'
import PowerTag from './components/PowerTag.vue'
import StatusTag from './components/StatusTag.vue'
import { createStatusTagShard } from './lib/StatusTag'
import { powerTags, statusTags } from './lib/yjs'

const newTagId = ref('')
const tagIds = ref<string[]>([])

const newStatusName = ref('')
const statusNames = ref<string[]>([])

function syncTagIds() {
  tagIds.value = Array.from(powerTags.keys())
}

function syncStatusNames() {
  statusNames.value = Array.from(statusTags.keys())
}

const observer = ()=> {
  syncTagIds()
  syncStatusNames()
}

onMounted(()=> {
  syncTagIds()
  syncStatusNames()
  powerTags.observe(observer)
  statusTags.observe(observer)
})

onUnmounted(()=> {
  powerTags.unobserve(observer)
  statusTags.unobserve(observer)
})

const statusEntries = computed(()=>
  statusNames.value
    .map(name=> ({
      name,
      shard: statusTags.get(name)
    }))
    .filter((entry): entry is { name: string; shard: Y.Map<any> }=> !!entry.shard)
)

function addTag() {
  const id = newTagId.value.trim()
  if (!id || powerTags.has(id)) return

  powerTags.set(id, 0)
  newTagId.value = ''
}

function addStatus() {
  const name = newStatusName.value.trim()
  if (!name || statusTags.has(name)) return

  statusTags.set(name, createStatusTagShard({name}))
  newStatusName.value = ''
}
</script>

<template>
  <main>
    <NavigationBar />

    <div class="toolbar">
      <input
        v-model="newTagId"
        placeholder="Enter tag name"
        @keyup.enter="addTag"
      />
      <button @click="addTag">Add Power Tag</button>
    </div>
    <div class="tag-holder">
      <PowerTag
        v-for="tagId in tagIds"
        :key="tagId"
        :ymap="powerTags"
        :field="tagId"
      />
    </div>

    <div class="toolbar">
      <input
        v-model="newStatusName"
        placeholder="Enter status name"
        @keyup.enter="addStatus"
      />
      <button @click="addStatus">Add Status</button>
    </div>
    <div class="tag-holder">
      <StatusTag
        v-for="entry in statusEntries"
        :key="entry.name"
        :shard="entry.shard"
      />
    </div>
  </main>
</template>

<style>
.tag-holder {
  display: flex;
  flex-wrap: wrap;
}
</style>