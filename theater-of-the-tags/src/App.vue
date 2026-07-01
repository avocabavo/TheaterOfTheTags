<script setup lang="ts">
import * as Y from 'yjs'
import { computed, onMounted, onUnmounted, ref } from 'vue'

import NavigationBar from './components/NavigationBar.vue'
import StatusTag from './components/StatusTag.vue'
import Tag from './components/Tag.vue'
import { createStatusTagShard } from './lib/StatusTag'
import { fellowships, heroes, statusTags, tags, themes } from './lib/yjs'
import { createTagShard } from './lib/Tag'
import { createThemeShard } from './lib/Theme'
import Theme from './components/Theme.vue'
import {
  createHeroShard,
  createHeroShardFromData,
  getHeroCharacterNameFromData,
  parseHeroDataFromYaml,
} from './lib/Hero'
import Hero from './components/Hero.vue'
import Fellowship from './components/Fellowship.vue'
import {
  createFellowshipShard,
  createFellowshipShardFromData,
  getFellowshipNameFromData,
  parseFellowshipDataFromYaml,
} from './lib/Fellowship'

type HeroEntry = {
  name: string
  characterName: string
  shard: Y.Map<any>
}

type FellowshipEntry = {
  name: string
  fellowshipName: string
  shard: Y.Map<any>
}

const newStatusName = ref('')
const statusNames = ref<string[]>([])

const newTagName = ref('')
const tagNames = ref<string[]>([])

const newThemePrimaryTagName = ref('')
const themeNames = ref<string[]>([])

const newFellowshipName = ref('')
const fellowshipNames = ref<string[]>([])
const showFellowshipForm = ref(false)
const showFellowshipImportForm = ref(false)
const fellowshipYamlText = ref('')
const fellowshipImportError = ref('')

const newHeroCharacterName = ref('')
const newHeroPlayerName = ref('')
const heroNames = ref<string[]>([])
const showHeroForm = ref(false)
const showHeroImportForm = ref(false)
const heroYamlText = ref('')
const heroImportError = ref('')

const randomHeroFirstNameSyllables = [
  'ah', 'ast', 'ra', 'bri', 'ar', 'cor', 'in',
  'del', 'fab', 'gal', 'en', 'hol', 'lis', 'ilya', 'jun',
  'kes', 'trel', 'lio', 'pam', 'jim', 'ril', 'daz', 'vue',
  'gorm', 'bus', 'bla', 'ko', 'ro', 'ni', 'foo', 'bar',
  'baz', 'ama',
]

const randomHeroLastNameParts = [
  'ash', 'fall', 'bright', 'vale', 'cinder', 'wake', 'dawn', 'mere',
  'ember', 'ly', 'frost', 'glen', 'gold', 'river', 'hearth', 'ward',
  'iron', 'vale', 'moon', 'well', 'storm', 'holt', 'wilde', 'rose',
  'sage', 'smith', 'tron', 'gofer', 'trax', 'man', 'son', 'berg',
  'zorel', 'march', 'haven', 'amper', 'wood', 'fish', 'maker', 'beech',
  'clog', 'glow', 'fever', 'gale', 'zephyr', 'camp', 'lion', 'find',
]

function syncStatusNames() {
  statusNames.value = Array.from(statusTags.keys())
}

function syncTagNames() {
  tagNames.value = Array.from(tags.keys())
}

function syncThemeNames() {
  themeNames.value = Array.from(themes.keys())
}

function syncFellowshipNames() {
  fellowshipNames.value = Array.from(fellowships.keys())
    .filter((name): name is string => typeof name === 'string' && !!name.trim())
}

function syncHeroNames() {
  heroNames.value = Array.from(heroes.keys())
    .filter((name): name is string => typeof name === 'string' && !!name.trim())
}

const observer = ()=> {
  syncStatusNames()
  syncTagNames()
  syncThemeNames()
  syncFellowshipNames()
  syncHeroNames()
}

onMounted(()=> {
  syncStatusNames()
  syncTagNames()
  syncThemeNames()
  syncFellowshipNames()
  syncHeroNames()
  statusTags.observe(observer)
  tags.observe(observer)
  themes.observe(observer)
  fellowships.observe(observer)
  heroes.observe(observer)
})

onUnmounted(()=> {
  statusTags.unobserve(observer)
  tags.unobserve(observer)
  themes.unobserve(observer)
  fellowships.unobserve(observer)
  heroes.unobserve(observer)
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

const fellowshipEntries = computed(()=>
  fellowshipNames.value
    .map(name=> {
      const shard = fellowships.get(name)
      const shardFellowshipName = shard?.get('fellowshipName')
      const fellowshipName = typeof shardFellowshipName === 'string' && shardFellowshipName.trim()
        ? shardFellowshipName
        : name

      return {
        name,
        fellowshipName,
        shard
      }
    })
    .filter((entry): entry is FellowshipEntry=> !!entry.shard)
)

const heroEntries = computed(()=>
  heroNames.value
    .map(name=> {
      const shard = heroes.get(name)
      const shardCharacterName = shard?.get('characterName')
      const characterName = typeof shardCharacterName === 'string' && shardCharacterName.trim()
        ? shardCharacterName
        : name

      return {
        name,
        characterName,
        shard
      }
    })
    .filter((entry): entry is HeroEntry=> !!entry.shard)
)

function heroId(characterName: string) {
  return `hero-${encodeURIComponent(characterName)}`
}

function fellowshipId(fellowshipName: string) {
  return `fellowship-${encodeURIComponent(fellowshipName)}`
}

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
    primaryTagName: name
  }))
  newThemePrimaryTagName.value = ''
}

function addFellowship() {
  const fellowshipName = newFellowshipName.value.trim()
  if (!fellowshipName || fellowships.has(fellowshipName)) return

  fellowships.set(fellowshipName, createFellowshipShard({ fellowshipName }))
  newFellowshipName.value = ''
}

function openFellowshipForm() {
  showFellowshipForm.value = true
}

function closeFellowshipForm() {
  showFellowshipForm.value = false
}

function openFellowshipImportForm() {
  fellowshipImportError.value = ''
  showFellowshipImportForm.value = true
}

function closeFellowshipImportForm() {
  showFellowshipImportForm.value = false
  fellowshipImportError.value = ''
}

function createFellowshipFromForm() {
  const fellowshipName = newFellowshipName.value.trim()
  if (!fellowshipName || fellowships.has(fellowshipName)) return

  addFellowship()
  closeFellowshipForm()
}

function importFellowshipFromYaml() {
  fellowshipImportError.value = ''

  try {
    const fellowshipData = parseFellowshipDataFromYaml(fellowshipYamlText.value)
    const fellowshipName = getFellowshipNameFromData(fellowshipData)

    if (!fellowshipName) {
      fellowshipImportError.value = 'Fellowship YAML needs a fellowship name'
      return
    }

    if (fellowships.has(fellowshipName)) {
      fellowshipImportError.value = 'A fellowship with that name already exists'
      return
    }

    const fellowshipShard = createFellowshipShardFromData(fellowshipData)
    fellowships.set(fellowshipName, fellowshipShard)
    fellowshipYamlText.value = ''
    closeFellowshipImportForm()
  } catch (e) {
    fellowshipImportError.value = e instanceof Error ? e.message : 'Invalid fellowship YAML'
  }
}

function addHero() {
  const characterName = newHeroCharacterName.value.trim()
  if (!characterName || heroes.has(characterName)) return
  const playerName = newHeroPlayerName.value.trim()
  if (!playerName) return

  heroes.set(characterName, createHeroShard({
    characterName, playerName
  }))
  newHeroCharacterName.value = ''
  newHeroPlayerName.value = ''
}

function openHeroForm() {
  showHeroForm.value = true
}

function closeHeroForm() {
  showHeroForm.value = false
}

function openHeroImportForm() {
  heroImportError.value = ''
  showHeroImportForm.value = true
}

function closeHeroImportForm() {
  showHeroImportForm.value = false
  heroImportError.value = ''
}

function createHeroFromForm() {
  const characterName = newHeroCharacterName.value.trim()
  const playerName = newHeroPlayerName.value.trim()
  if (!characterName || !playerName || heroes.has(characterName)) return

  addHero()
  closeHeroForm()
}

function importHeroFromYaml() {
  heroImportError.value = ''

  try {
    const heroData = parseHeroDataFromYaml(heroYamlText.value)
    const characterName = getHeroCharacterNameFromData(heroData)

    if (!characterName) {
      heroImportError.value = 'Hero YAML needs a character name'
      return
    }

    if (heroes.has(characterName)) {
      heroImportError.value = 'A hero with that character name already exists'
      return
    }

    const heroShard = createHeroShardFromData(heroData)
    heroes.set(characterName, heroShard)
    heroYamlText.value = ''
    closeHeroImportForm()
  } catch (e) {
    heroImportError.value = e instanceof Error ? e.message : 'Invalid hero YAML'
  }
}

function generateRandomHeroName() {
  const firstNameSyllableCount = Math.floor(Math.random() * 3) + Math.floor(Math.random() * 3) + 1
  const firstNameSyllables = [...randomHeroFirstNameSyllables]
  const firstNameParts: string[] = []

  for (let i = 0; i < firstNameSyllableCount; i += 1) {
    const index = Math.floor(Math.random() * firstNameSyllables.length)
    firstNameParts.push(firstNameSyllables[index])
    firstNameSyllables[index] = firstNameSyllables[firstNameSyllables.length - 1]
    firstNameSyllables.pop()
  }

  const lastNameParts = [...new Set(randomHeroLastNameParts)]
  const lastName: string[] = []

  for (let i = 0; i < 2; i += 1) {
    const index = Math.floor(Math.random() * lastNameParts.length)
    lastName.push(lastNameParts[index])
    lastNameParts[index] = lastNameParts[lastNameParts.length - 1]
    lastNameParts.pop()
  }

  const firstName = firstNameParts.join('')
  const familyName = lastName.join('')
  const baseName = `${firstName[0].toUpperCase()}${firstName.slice(1)} ${familyName[0].toUpperCase()}${familyName.slice(1)}`
  let characterName = baseName
  let suffix = 2

  while (heroes.has(characterName)) {
    characterName = `${baseName} ${suffix}`
    suffix += 1
  }

  newHeroCharacterName.value = characterName
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

function deleteFellowship(name: string) {
  fellowships.delete(name)
}

function deleteHero(name: string) {
  heroes.delete(name)
}
</script>

<template>
  <main>
    <NavigationBar :fellowships="fellowshipEntries" :heroes="heroEntries" />

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

    <div class="toolbar">
      <button type="button" @click="openFellowshipForm">Add Fellowship</button>
      <button type="button" @click="openFellowshipImportForm">Import Fellowship YAML</button>
    </div>

    <div
      v-if="showFellowshipForm"
      class="modal-backdrop"
      @click.self="closeFellowshipForm"
    >
      <form class="hero-form-modal fellowship-form-modal" @submit.prevent="createFellowshipFromForm">
        <h2>Create Fellowship</h2>

        <label class="form-field">
          <span>Fellowship Name</span>
          <input
            v-model="newFellowshipName"
            placeholder="Enter fellowship name"
          />
        </label>

        <div class="modal-actions">
          <button type="button" class="secondary-button" @click="closeFellowshipForm">
            Cancel
          </button>
          <button type="submit">Create Fellowship</button>
        </div>
      </form>
    </div>
    <div
      v-if="showFellowshipImportForm"
      class="modal-backdrop"
      @click.self="closeFellowshipImportForm"
    >
      <form class="hero-form-modal fellowship-form-modal" @submit.prevent="importFellowshipFromYaml">
        <h2>Import Fellowship YAML</h2>

        <label class="form-field">
          <span>Fellowship YAML</span>
          <textarea
            v-model="fellowshipYamlText"
            placeholder="Paste fellowship YAML"
            @input="fellowshipImportError = ''"
          />
        </label>

        <p v-if="fellowshipImportError" class="form-error">{{ fellowshipImportError }}</p>

        <div class="modal-actions">
          <button type="button" class="secondary-button" @click="closeFellowshipImportForm">
            Cancel
          </button>
          <button type="submit" :disabled="!fellowshipYamlText.trim()">Import</button>
        </div>
      </form>
    </div>
    <div class="tag-holder">
      <Fellowship
        v-for="entry in fellowshipEntries"
        :id="fellowshipId(entry.fellowshipName)"
        :key="entry.name"
        :shard="entry.shard"
        @delete="deleteFellowship(entry.name)"
      />
    </div>

    <div class="toolbar">
      <button type="button" @click="openHeroForm">Add Hero</button>
      <button type="button" @click="openHeroImportForm">Import Hero YAML</button>
    </div>

    <div
      v-if="showHeroForm"
      class="modal-backdrop"
      @click.self="closeHeroForm"
    >
      <form class="hero-form-modal" @submit.prevent="createHeroFromForm">
        <h2>Create Hero</h2>

        <label class="form-field">
          <span>Character Name</span>
          <div class="character-name-row">
            <input
              v-model="newHeroCharacterName"
              placeholder="Enter character name"
            />
            <button
              type="button"
              class="secondary-button"
              @click="generateRandomHeroName"
            >
              Random
            </button>
          </div>
        </label>

        <label class="form-field">
          <span>Player Name</span>
          <input
            v-model="newHeroPlayerName"
            placeholder="Enter player name"
          />
        </label>

        <div class="modal-actions">
          <button type="button" class="secondary-button" @click="closeHeroForm">
            Cancel
          </button>
          <button type="submit">Create Hero</button>
        </div>
      </form>
    </div>
    <div
      v-if="showHeroImportForm"
      class="modal-backdrop"
      @click.self="closeHeroImportForm"
    >
      <form class="hero-form-modal" @submit.prevent="importHeroFromYaml">
        <h2>Import Hero YAML</h2>

        <label class="form-field">
          <span>Hero YAML</span>
          <textarea
            v-model="heroYamlText"
            placeholder="Paste hero YAML"
            @input="heroImportError = ''"
          />
        </label>

        <p v-if="heroImportError" class="form-error">{{ heroImportError }}</p>

        <div class="modal-actions">
          <button type="button" class="secondary-button" @click="closeHeroImportForm">
            Cancel
          </button>
          <button type="submit" :disabled="!heroYamlText.trim()">Import</button>
        </div>
      </form>
    </div>
    <div class="tag-holder">
      <Hero
        v-for="entry in heroEntries"
        :id="heroId(entry.characterName)"
        :key="entry.name"
        :shard="entry.shard"
        @delete="deleteHero(entry.name)"
      />
    </div>
  </main>
</template>

<style>
.tag-holder {
  display: flex;
  flex-wrap: wrap;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 200;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 1rem;
  background: rgba(0, 0, 0, 0.55);
}

.hero-form-modal {
  box-sizing: border-box;
  width: min(100%, 28rem);
  padding: 1rem;
  border: 0.25rem solid #853;
  border-radius: 0.5rem;

  display: flex;
  flex-direction: column;
  gap: 0.85rem;

  background: #fca;
  color: #433;
}

.hero-form-modal h2 {
  margin: 0;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;

  font-weight: 600;
}

.form-field input,
.form-field textarea {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: 0.45rem 0.55rem;
  border: 0.15rem solid #853;
  border-radius: 0.25rem;
  font: inherit;
}

.form-field textarea {
  min-height: 12rem;
  resize: vertical;
}

.form-error {
  margin: 0;
  color: #8b1e1e;
  font-weight: 600;
}

.character-name-row,
.modal-actions {
  display: flex;
  gap: 0.5rem;
}

.character-name-row input {
  flex: 1 1 auto;
}

.modal-actions {
  justify-content: flex-end;
}

.hero-form-modal button {
  flex: 0 0 auto;
  padding: 0.45rem 0.75rem;
  border: 0.15rem solid #853;
  border-radius: 0.35rem;
  background: #c65;
  color: #433;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.hero-form-modal .secondary-button {
  background: #f7d5b7;
}

.fellowship-form-modal {
  border-color: #2c7ea0;
  background: #bfe9ff;
  color: #12384a;
}

.fellowship-form-modal .form-field input,
.fellowship-form-modal .form-field textarea {
  border-color: #2c7ea0;
}

.fellowship-form-modal button {
  border-color: #2c7ea0;
  background: #62b7dc;
  color: #12384a;
}

.fellowship-form-modal .secondary-button {
  background: #e4f6ff;
}

.hero-form-modal button:disabled {
  cursor: default;
  opacity: 0.55;
}

@media (max-width: 32rem) {
  .character-name-row,
  .modal-actions {
    flex-direction: column;
  }
}
</style>
