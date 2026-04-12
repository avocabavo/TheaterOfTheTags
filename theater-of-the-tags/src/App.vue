<script setup lang="ts">
import * as Y from 'yjs'
import { computed, onMounted, onUnmounted, ref } from 'vue'

import NavigationBar from './components/NavigationBar.vue'
import StatusTag from './components/StatusTag.vue'
import Tag from './components/Tag.vue'
import { createStatusTagShard } from './lib/StatusTag'
import { statusTags, tags, themes } from './lib/yjs'
import { createTagShard } from './lib/Tag'
import { createThemeShard } from './lib/Theme'
import Theme from './components/Theme.vue'

const newStatusName = ref('')
const statusNames = ref<string[]>([])

const newTagName = ref('')
const tagNames = ref<string[]>([])

const newThemePrimaryTagName = ref('')
const themeNames = ref<string[]>([])

function syncStatusNames() {
  statusNames.value = Array.from(statusTags.keys())
}

function syncTagNames() {
  tagNames.value = Array.from(tags.keys())
}

function syncThemeNames() {
  themeNames.value = Array.from(themes.keys())
}

const observer = ()=> {
  syncStatusNames()
  syncTagNames()
  syncThemeNames()
}

onMounted(()=> {
  syncStatusNames()
  syncTagNames()
  syncThemeNames()
  statusTags.observe(observer)
  tags.observe(observer)
  themes.observe(observer)
})

onUnmounted(()=> {
  statusTags.unobserve(observer)
  tags.unobserve(observer)
  themes.unobserve(observer)
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

const themeEntries = computed(()=>
  themeNames.value
    .map(name=> ({
      name,
      shard: themes.get(name)
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

function addTheme() {
  const name = newThemePrimaryTagName.value.trim()
  if (!name || themes.has(name)) return

  themes.set(name, createThemeShard({
    might: 'origin',
    themeType: 'circumstance',
    themeTagName: name
  }))
  newThemePrimaryTagName.value = ''
}

function deleteStatus(name: string) {
  statusTags.delete(name)
}

function deleteTag(name: string) {
  tags.delete(name)
}

function deleteTheme(name: string) {
  themes.delete(name)
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
        @delete="deleteStatus(entry.name)"
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
        @delete="deleteTag(entry.name)"
      />
    </div>

    <div class="toolbar">
      <input
        v-model="newThemePrimaryTagName"
        placeHolder="Enter theme name"
        @keyup.enter="addTheme"
      />
      <button @click="addTheme">Add Theme</button>
    </div>
    <div class="tag-holder">
      <Theme
        v-for="entry in themeEntries"
        :key="entry.name"
        :shard="entry.shard"
        @delete="deleteTheme(entry.name)"
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