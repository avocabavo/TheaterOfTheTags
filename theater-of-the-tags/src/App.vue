<script setup lang="ts">
import * as Y from 'yjs'
import { computed, onMounted, onUnmounted, ref } from 'vue'

import NavigationBar from './components/NavigationBar.vue'
import StatusTag from './components/StatusTag.vue'
import Tag from './components/Tag.vue'
import { createStatusTagShard } from './lib/StatusTag'
import { statusTags, tags } from './lib/yjs'
import { createTagShard } from './lib/Tag'

const newStatusName = ref('')
const statusNames = ref<string[]>([])

const newTagName = ref('')
const tagNames = ref<string[]>([])

function syncStatusNames() {
  statusNames.value = Array.from(statusTags.keys())
}

function syncTags() {
  tagNames.value = Array.from(tags.keys())
}

const observer = ()=> {
  syncStatusNames()
  syncTags()
}

onMounted(()=> {
  syncStatusNames()
  syncTags()
  statusTags.observe(observer)
  tags.observe(observer)
})

onUnmounted(()=> {
  statusTags.unobserve(observer)
  tags.unobserve(observer)
})

const statusEntries = computed(()=>
  statusNames.value
    .map(name=> ({
      name,
      shard: statusTags.get(name)
    }))
    .filter((entry): entry is { name: string; shard: Y.Map<any> }=> !!entry.shard)
)

const tagEntries = computed(()=>
  tagNames.value
    .map(name=> ({
      name,
      shard: tags.get(name)
    }))
    .filter((entry): entry is { name: string; shard: Y.Map<any> }=> !!entry.shard)
)

function addStatus() {
  const name = newStatusName.value.trim()
  if (!name || statusTags.has(name)) return

  statusTags.set(name, createStatusTagShard({name}))
  newStatusName.value = ''
}

function addTag() {
  const name = newTagName.value.trim()
  if (!name || tags.has(name)) return

  tags.set(name, createTagShard({name}))
  newTagName.value = ''
}
</script>

<template>
  <main>
    <NavigationBar />

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

    <div class="toolbar">
      <input
        v-model="newTagName"
        placeHolder="Enter tag name"
        @keyup.enter="addTag"
      />
      <button @click="addTag">Add Tag</button>
    </div>
    <div class="tag-holder">
      <Tag
        v-for="entry in tagEntries"
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