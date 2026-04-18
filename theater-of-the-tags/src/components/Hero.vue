<script setup lang="ts">
import * as Y from 'yjs'
import YAML from 'yaml'
import { useMode } from '../lib/modeStore';
import DeleteButton from './DeleteButton.vue';
import { useYArray, useYMapField } from '../lib/yjsComposables';
import type { HeroData, Might, TagNature, TagShard, ThemeShard, ThemeType } from '../lib/schema';
import Bubbles from './Bubbles.vue';
import { onBeforeUpdate, ref } from 'vue';
import { createTagShard } from '../lib/Tag';
import Tag from './Tag.vue';
import NewTag from './NewTag.vue';
import Theme from './Theme.vue';
import { createThemeShard } from '../lib/Theme';
import NewTheme from './NewTheme.vue';
import CharacterName from './CharacterName.vue';

const { mode } = useMode()

const props = defineProps<{
  shard: Y.Map<any>
}>()

const newQuintessence = ref('')

const playerName = useYMapField<HeroData, 'playerName'>(props.shard, 'playerName', '')

const {
  items: quintessences,
  push: pushQuintessence,
  remove: removeQuintessence,
} = useYArray<string>(props.shard, 'quintessences')

const {
  items: backpackTags,
  push: addBackpackTag,
  remove: removeBackpackTag,
} = useYArray<TagShard>(props.shard, 'backpack')

const {
  items: themes,
  push: addTheme,
  remove: removeTheme,
} = useYArray<ThemeShard>(props.shard, 'themes')

const emit = defineEmits<{
  (e: 'delete'): void
}>()

function createQuintessence() {
  const trimmed = newQuintessence.value.trim()
  if (!trimmed) return

  pushQuintessence(trimmed)
  newQuintessence.value = ''
}

function handleCreateTag(data: {name: string, nature: TagNature, scratched: boolean}) {
  const newShard = createTagShard(data)
  addBackpackTag(newShard)
}

function handleCreateTheme(data: {might: Might, themeType: ThemeType, primaryTagName: string}) {
  console.log(`Handling theme creation for a ${data.might} - ${data.themeType} theme called ${data.primaryTagName}`)
  const newShard = createThemeShard(data)
  addTheme(newShard)
}

const fieldRefs = ref<any[]>([])

function setFieldRef(el: any) {
  if (el) fieldRefs.value.push(el)
}

const backpackTagRefs = ref<any[]>([])

function setBackpackTagRef(el: any) {
  if (el) backpackTagRefs.value.push(el)
}

const themeRefs = ref<any[]>([])

function setThemeRef(el: any) {
  if (el) themeRefs.value.push(el)
}

onBeforeUpdate(()=> {
  backpackTagRefs.value = []
  themeRefs.value = []
})

function toJson() {
  return {
    ...Object.assign(
      {},
      ...fieldRefs.value.map(b=> b.toJson())
    ),
    playerName: playerName.value,
    quintessences: quintessences.value,
    backpackTags: backpackTagRefs.value.map(t=> t.toJson()),
    themes: themeRefs.value.map(t=> t.toJson())
  }
}

function print() {
  console.log(YAML.stringify(toJson(), null, 2))
}
</script>

<template>
  <div class="hero">
    <div class="hero-card">
      <DeleteButton v-if="mode !== 'scene'" @delete="emit('delete')" />

      <div class="static-words">
        <p @click="print">HERO CARD</p>
      </div>
      <CharacterName :shard="shard" :ref="setFieldRef" />
      <div class="player-name">
        <div class="small static-words">
          <p>PLAYER NAME</p>
        </div>
        <h3>{{ playerName }}</h3>
      </div>

      <div class="tag-section">
        <div class="promise-holder">
          <Bubbles
            :shard="shard"
            :ref="setFieldRef"
            field="promise"
            :max="5"
            name="PROMISE"
          />
        </div>
      </div>

      <div class="quintessences">
        <p class="static-words">QUINTESSENCES</p>
        <div
          v-for="(quintessence, index) in quintessences"
          class="quintessence-box"
        >
          <DeleteButton v-if="mode === 'narrator'" @delete="removeQuintessence(index)" />
          <p>{{ quintessence }}</p>
        </div>
        <div class="quintessence-box">
          <input
            v-model="newQuintessence"
            @keydown.enter="createQuintessence"
            placeholder="new quintessence"
          >
          <button @click="createQuintessence">+</button>
        </div>
      </div>
    </div>

    <div class="backpack">
      <p class="static-words">BACKPACK</p>
      <div class="tag-section">
        <Tag
          v-for="(tag, index) in backpackTags"
          :key="tag.get('uuid')"
          :ref="setBackpackTagRef"
          :shard="tag"
          @delete="removeBackpackTag(index)"
        />
        <NewTag
          v-if="mode !== 'scene'"
          nature="power"
          @create="handleCreateTag"
        />
        <NewTag
          v-if="mode !== 'scene'"
          nature="weakness"
          @create="handleCreateTag"
        />
      </div>
    </div>

    <Theme
      v-for="(theme, index) in themes"
      :key="theme.get('uuid')"
      :ref="setThemeRef"
      :shard="theme"
      @delete="removeTheme(index)"
    />

    <NewTheme
      v-if="mode !== 'scene'"
      @create="handleCreateTheme"
    />
  </div>
</template>

<style scoped>
.hero {
  position: relative;
  border: 3px solid violet;

  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: start;
  gap: 1rem;
}

.hero-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;

  width: 25rem;

  background: #fca;
}

.player-name {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;

  color: black;
}

.tag-section {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
}

.promise-holder {
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: baseline;
  justify-content: space-around;
}

.static-words {
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-around;
}

.hero-card .static-words {
  background-color: #c65;
}

.static-words p {
  margin-top: 0.2rem;
  margin-bottom: 0.2rem;
  font-size: x-large;
  color: #433;
}
.static-words.small p {
  font-size: large;
}

.quintessences {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
}

.quintessence-box {
  position: relative;
  padding: 0.25rem 1rem;
  margin: 0.25rem;
  border: 0.2rem solid rgba(0, 0, 0, 0.5);
  border-radius: 999rem;
  box-sizing: border-box;

  max-width: 25rem;
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: 0.5rem;
}

.quintessence-box p {
  margin: 0.25rem;
}

.backpack {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  background: #444;

  width: 25rem;
}
</style>