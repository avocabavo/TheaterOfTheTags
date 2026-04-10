<script setup lang="ts">
import NavigationBar from './components/NavigationBar.vue'
import PowerTag from './components/PowerTag.vue'
import { powerTags } from './lib/yjs'
import { computed, onMounted, onUnmounted, ref } from 'vue'

const newTagId = ref('')
const tagIds = ref<string[]>([])

function syncTagIds() {
  tagIds.value = Array.from(powerTags.keys())
}

const observer = ()=> {
  syncTagIds()
}

onMounted(()=> {
  syncTagIds()
  powerTags.observe(observer)
})

onUnmounted(()=> {
  powerTags.unobserve(observer)
})

function addTag() {
  const id = newTagId.value.trim()
  if (!id || powerTags.has(id)) return

  powerTags.set(id, 0)
  newTagId.value = ''
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
  </main>
</template>

<style>
.tag-holder {
  display: flex;
  flex-wrap: wrap;
}
</style>