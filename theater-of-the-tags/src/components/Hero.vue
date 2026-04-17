<script setup lang="ts">
import * as Y from 'yjs'
import { useMode } from '../lib/modeStore';
import DeleteButton from './DeleteButton.vue';
import { useYArray, useYMapField } from '../lib/yjsComposables';
import type { HeroData, Might, TagNature, TagShard, ThemeShard, ThemeType } from '../lib/schema';
import Bubbles from './Bubbles.vue';
import { ref } from 'vue';
import { createTagShard } from '../lib/Tag';
import Tag from './Tag.vue';
import NewTag from './NewTag.vue';
import Theme from './Theme.vue';
import { createThemeShard } from '../lib/Theme';
import NewTheme from './NewTheme.vue';

const { mode } = useMode()

const props = defineProps<{
  shard: Y.Map<any>
}>()

const newQuintessence = ref('')

const characterName = useYMapField<HeroData, 'characterName'>(props.shard, 'characterName', '')
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

</script>

<template>
  <div class="hero">
    <div class="hero-card">
      <DeleteButton v-if="mode !== 'scene'" @delete="emit('delete')" />

      <p class="static-words">HERO CARD</p>
      <div class="character-name">
        <h1>{{ characterName }}</h1>
      </div>
      <div class="player-name">
        <h3>{{ playerName }}</h3>
      </div>

      <div class="tag-section">
        <Bubbles
          :shard="shard"
          field="promise"
          :max="5"
          name="PROMISE"
        />
      </div>

      <div class="tag-section">
        <div
          v-for="(quintessence, index) in quintessences"
          class="quintessence-box"
        >
          <DeleteButton v-if="mode === 'narrator'" @delete="removeQuintessence(index)" />
          <p>{{ quintessence }}</p>
        </div>
        <div>
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
      :shard="theme"
      @delete="removeTheme(index)"
    />

    <NewTheme
      v-if="mode !== 'scene'"
      @create="handleCreateTheme"
    />
  </div>
</template>

<style>
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

  background: #500;
}

.tag-section {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
}

.static-words {
  margin-top: 0.2rem;
  margin-bottom: 0.2rem;
  font-size: x-large;
  color: gray;
}

.quintessence-box {
  position: relative;
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