<script setup lang="ts">
import * as Y from 'yjs'
import YAML from 'yaml'
import { useMode } from '../lib/modeStore';
import DeleteButton from './buttons/DeleteButton.vue';
import { useYArray, useYMapField } from '../lib/yjsComposables';
import {
  type HeroData,
  type StatusTagShard,
  type TagShard,
  type ThemeShard,
} from '../lib/schema';
import Bubbles from './Bubbles.vue';
import { computed, nextTick, onBeforeUpdate, onMounted, ref, watch } from 'vue';
import Theme from './Theme.vue';
import { createThemeShard, type ThemeCreationProps } from '../lib/Theme';
import NewTheme from './NewTheme.vue';
import CharacterName from './CharacterName.vue';
import { useDragDrop, useFieldCollector } from '../lib/util';
import PlayerName from './PlayerName.vue';
import Masonry from 'masonry-layout'
import Backpack from './Backpack.vue';
import LooseTag from './LooseTag.vue';
import NewLooseTags from './NewLooseTags.vue';
import { createTagShard, type TagCreationProps } from '../lib/Tag';
import { createStatusTagShard, type StatusCreationProps } from '../lib/StatusTag';
import EditableText from './EditableText.vue';
import Tag from './Tag.vue'
import NewTag from './NewTag.vue';
import toYamlBlack from '../assets/to-yaml-black.svg'

const { mode } = useMode()

const props = defineProps<{
  shard: Y.Map<any>
}>()

const grid = ref(null)

const playerName = useYMapField<HeroData, 'playerName'>(props.shard, 'playerName', '')

const {
  items: relationships,
  push: pushRelationship,
  remove: removeRelationship,
  move: moveRelationship,
} = useYArray<TagShard>(props.shard, 'relationships', reflowMasonry)

const {
  onDrag: onRelationshipDrag,
  onDrop: onRelationshipDrop,
} = useDragDrop(moveRelationship, reflowMasonry)

function handleCreateRelationship(data: TagCreationProps) {
  const newShard = createTagShard(data)
  pushRelationship(newShard)
}

const relationshipTagRefs = ref<any[]>([])

function setRelationshipTagRef(el: any) {
  if (el) relationshipTagRefs.value.push(el)
}

const {
  items: quintessences,
  push: pushQuintessence,
  remove: removeQuintessence,
  move: moveQuintessence,
  set: setQuintessence,
} = useYArray<string>(props.shard, 'quintessences', reflowMasonry)

const newQuintessence = ref('')

const {
  onDrag: onQuintessenceDrag,
  onDrop: onQuintessenceDrop,
} = useDragDrop(moveQuintessence, reflowMasonry)

const {
  items: themes,
  push: addTheme,
  remove: removeTheme,
  move: moveTheme,
} = useYArray<ThemeShard>(props.shard, 'themes', reflowMasonry)

const {
  onDrag: onThemeDragStart,
  onDrop: onThemeDrop,
} = useDragDrop(moveTheme, reflowMasonry)

const emit = defineEmits<{
  (e: 'delete'): void
}>()

function createQuintessence() {
  const trimmed = newQuintessence.value.trim()
  if (!trimmed) return

  pushQuintessence(trimmed)
  newQuintessence.value = ''
}

function handleCreateTheme(data: ThemeCreationProps) {
  const newShard = createThemeShard(data)
  addTheme(newShard)
}

const {
  items: looseTags,
  push: addLooseTag,
  remove: removeLooseTag,
  move: moveLooseTag,
} = useYArray<TagShard | StatusTagShard>(props.shard, 'looseTags', reflowMasonry)

const {
  onDrag: onLooseTagDrag,
  onDrop: onLooseTagDrop,
} = useDragDrop(moveLooseTag, reflowMasonry)

function handleCreateLooseTag(data: TagCreationProps) {
  const newShard = createTagShard(data)
  addLooseTag(newShard)
}

function handleCreateLooseStatus(data: StatusCreationProps) {
  const newShard = createStatusTagShard(data)
  addLooseTag(newShard)
}

const { fieldRefs, setFieldRef } = useFieldCollector()

const backpackRef = ref<typeof Backpack | null>()

const themeRefs = ref<any[]>([])

const looseTagRefs = ref<any[]>([])

function setThemeRef(el: any) {
  if (el) themeRefs.value.push(el)
}

function setLooseTagRef(el: any) {
  if (el) looseTagRefs.value.push(el)
}

onBeforeUpdate(()=> {
  relationshipTagRefs.value = []
  themeRefs.value = []
  looseTagRefs.value = []
})

let masonry: Masonry | null = null

onMounted(async ()=> {
  await nextTick()
  if (!grid.value) return
  masonry = new Masonry(grid.value, {
    itemSelector: '.grid-item',
    columnWidth: '.grid-sizer',
    gutter: 16,
  })
  reflowMasonry()
})

async function reflowMasonry() {
  await nextTick()
  masonry?.reloadItems?.()
  masonry?.layout?.()
}

watch(mode, async ()=> {
  await nextTick()
  reflowMasonry()
})

const readyToCreateQuintessence = computed(()=> newQuintessence.value.trim())

function toJson() {
  return {
    ...Object.assign(
      {},
      ...fieldRefs.value.map(b=> b.toJson())
    ),
    playerName: playerName.value,
    relationships: relationshipTagRefs.value.map(r=> r.toJson()),
    quintessences: quintessences.value,
    backpack: backpackRef.value?.toJson(),
    themes: themeRefs.value.map(t=> t.toJson()),
    looseTags: looseTagRefs.value.map(lt=> lt.toJson()),
  }
}

function toYaml() {
  return YAML.stringify(toJson(), null, 2)
}

async function copyToClipboard() {
  await navigator.clipboard.writeText(toYaml())
}
</script>

<template>
  <div ref="grid" class="hero">
    <div class="hero-card grid-item grid-sizer">
      <DeleteButton v-if="mode !== 'scene'" @delete="emit('delete')" />

      <div class="static-words">
        <p>HERO CARD</p>
        <button
          type="button"
          class="copy-button"
          aria-label="Copy hero card YAML"
          title="Copy hero card YAML"
          @click="copyToClipboard"
        >
          <img :src="toYamlBlack" alt="" class="copy-icon" aria-hidden="true">
        </button>
      </div>
      <CharacterName :shard="shard" :ref="setFieldRef" @resized="reflowMasonry"/>
      <PlayerName :shard="shard" :ref="setFieldRef" @resized="reflowMasonry"/>

      <div class="small static-words">
        <p>FELLOWSHIP RELATIONSHIP</p>
      </div>
      <div class="tag-section">
        <Tag
          v-for="(relationship, index) in relationships"
          :key="relationship.get('uuid')"
          :ref="setRelationshipTagRef"
          :shard="relationship"
          draggable="true"
          @dragstart="onRelationshipDrag(index)"
          @dragover.prevent
          @drop="onRelationshipDrop(index)"
          @delete="removeRelationship(index)"
          @resized="reflowMasonry"
        />
        <NewTag
          v-if="mode !== 'scene'"
          nature="power"
          @create="handleCreateRelationship"
        />
        <NewTag
          v-if="mode !== 'scene'"
          nature="weakness"
          @create="handleCreateRelationship"
        />
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
        <div class="small static-words">
          <p>QUINTESSENCES</p>
        </div>
        <div
          class="quintessence-box"
          v-for="(quintessence, index) in quintessences"
          :key="quintessence"
          draggable="true"
          @dragstart="onQuintessenceDrag(index)"
          @dragover.prevent
          @drop="onQuintessenceDrop(index)"
        >
          <DeleteButton v-if="mode === 'narrator'" @delete="removeQuintessence(index)" />
          <EditableText
            :model-value="quintessence"
            @update:modelValue="val => setQuintessence(index, val)"
            tag="p"
            :disabled="mode !== 'narrator'"
          />
        </div>
        <div class="quintessence-box">
          <input
            class="quintessence-input"
            v-model="newQuintessence"
            @keydown.enter="createQuintessence"
            placeholder="new quintessence"
          >
          <button
            type="button"
            class="add-quintessence-button"
            @click="createQuintessence"
            :disabled="!readyToCreateQuintessence"
          >+</button>
        </div>
      </div>
    </div>

    <Backpack
      class="grid-item"
      :shard="shard"
      ref="backpackRef"
      @resized="reflowMasonry"
    />

    <Theme
      class="grid-item"
      v-for="(theme, index) in themes"
      :key="theme.get('uuid')"
      :ref="setThemeRef"
      :shard="theme"
      draggable="true"
      @dragstart="onThemeDragStart(index)"
      @dragover.prevent
      @drop="onThemeDrop(index)"
      @delete="removeTheme(index)"
      @resized="reflowMasonry"
    />

    <NewTheme
      class="grid-item"
      v-if="mode !== 'scene'"
      @create="handleCreateTheme"
    />

    <LooseTag
      class="grid-item"
      v-for="(looseTag, index) in looseTags"
      :key="looseTag.get('uuid')"
      :ref="setLooseTagRef"
      :shard="looseTag"
      draggable="true"
      @dragstart="onLooseTagDrag(index)"
      @dragover.prevent
      @drop="onLooseTagDrop(index)"
      @delete="removeLooseTag(index)"
      @resized="reflowMasonry"
    />

    <NewLooseTags
      class="grid-item"
      v-if="mode !== 'scene'"
      @create-tag="handleCreateLooseTag"
      @create-status="handleCreateLooseStatus"
    />
  </div>
</template>

<style scoped>
.hero {
  position: relative;
  border: 3px solid black;
  width: 100%;
  padding: 1rem;
  scroll-margin-top: 5.5rem;
}
.hero>* {
  margin-bottom: 16px;
}

.grid-sizer,
.grid-item {
  width: 25rem;
  max-width: 100%;
}

.hero-card {
  box-sizing: border-box;
  border: 0.25rem solid #853;
  width: 25rem;

  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;

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
  box-sizing: border-box;
  width: 100%;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
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
  justify-content: center;
  gap: 0.35rem;
}

.hero-card .static-words {
  background-color: #c65;
  color: #433;
}

.static-words p {
  margin-top: 0.2rem;
  margin-bottom: 0.2rem;
  font-size: x-large;
}
.static-words.small p {
  font-size: large;
}

.copy-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  padding: 0.2rem;
  border: 1px solid currentColor;
  border-radius: 0.25rem;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.copy-button:hover,
.copy-button:focus-visible {
  background: rgba(255, 255, 255, 0.25);
}

.copy-icon {
  width: 1rem;
  height: 1rem;
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

.quintessence-box :deep(p) {
  margin: 0.25rem;
  color: black;
}

.quintessence-input {
  width: 100%;
  box-sizing: border-box;
  font-size: larger;
  background: rgba(255, 255, 255, 0.75);
  color: black;
}

.add-quintessence-button {
  aspect-ratio: 1;
  margin-top: 0;
  margin-left: 0.5rem;
  padding: 0.35rem 0.75rem;
  border: 1px solid currentColor;
  border-radius: 999rem;
  background: transparent;
  color: black;
  cursor: pointer;

  font-size: large;
}
.add-quintessence-button:disabled {
  color: gray;
  cursor: not-allowed;
}
</style>
