<script setup lang="ts">
import * as Y from 'yjs'
import { computed, onMounted, onUnmounted, ref } from 'vue'

import NavigationBar from './components/NavigationBar.vue'
import Room from './components/Room.vue'
import RollHistory from './components/RollHistory.vue'
import {
  fellowshipOrder,
  fellowships,
  heroOrder,
  heroes,
  situationOrder,
  situations,
} from './lib/yjs'
import { refreshTappedTags } from './lib/usage'
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
import Situation from './components/Situation.vue'
import {
  createSituationShard,
  createSituationShardFromData,
  getSituationNameFromData,
  parseSituationDataFromYaml,
} from './lib/Situation'
import { useDragDrop } from './lib/util'

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

type SituationEntry = {
  name: string
  situationName: string
  shard: Y.Map<any>
}

const newSituationName = ref('')
const situationNames = ref<string[]>([])
const showSituationForm = ref(false)
const showSituationImportForm = ref(false)
const situationYamlText = ref('')
const situationImportError = ref('')

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

function normalizeOrderedNames(map: Y.Map<any>, order: Y.Array<string>) {
  const keys = Array.from(map.keys())
    .filter((name): name is string => typeof name === 'string' && !!name.trim())
  const keySet = new Set(keys)
  const seen = new Set<string>()
  const normalized: string[] = []

  order.toArray().forEach(name=> {
    if (!keySet.has(name) || seen.has(name)) return
    seen.add(name)
    normalized.push(name)
  })

  keys.forEach(name=> {
    if (seen.has(name)) return
    seen.add(name)
    normalized.push(name)
  })

  const current = order.toArray()
  const changed = (
    current.length !== normalized.length
    || current.some((name, index)=> name !== normalized[index])
  )

  if (changed) {
    order.doc?.transact(()=> {
      order.delete(0, order.length)
      order.insert(0, normalized)
    })
  }

  return normalized
}

function moveOrderedName(order: Y.Array<string>, from: number, to: number) {
  if (from === to) return
  const name = order.get(from)
  if (!name) return

  order.doc?.transact(()=> {
    order.delete(from, 1)
    order.insert(to, [name])
  })
}

function appendOrderedName(order: Y.Array<string>, name: string) {
  if (order.toArray().includes(name)) return
  order.push([name])
}

function syncSituationNames() {
  situationNames.value = normalizeOrderedNames(situations, situationOrder)
}

function syncFellowshipNames() {
  fellowshipNames.value = normalizeOrderedNames(fellowships, fellowshipOrder)
}

function syncHeroNames() {
  heroNames.value = normalizeOrderedNames(heroes, heroOrder)
}

const observer = ()=> {
  syncSituationNames()
  syncFellowshipNames()
  syncHeroNames()
}

onMounted(()=> {
  syncSituationNames()
  syncFellowshipNames()
  syncHeroNames()
  situations.observe(observer)
  situationOrder.observe(observer)
  fellowships.observe(observer)
  fellowshipOrder.observe(observer)
  heroes.observe(observer)
  heroOrder.observe(observer)
})

onUnmounted(()=> {
  situations.unobserve(observer)
  situationOrder.unobserve(observer)
  fellowships.unobserve(observer)
  fellowshipOrder.unobserve(observer)
  heroes.unobserve(observer)
  heroOrder.unobserve(observer)
})

const {
  onDrag: onSituationDrag,
  onDrop: onSituationDrop,
} = useDragDrop((from, to)=> moveOrderedName(situationOrder, from, to), syncSituationNames)

const {
  onDrag: onFellowshipDrag,
  onDrop: onFellowshipDrop,
} = useDragDrop((from, to)=> moveOrderedName(fellowshipOrder, from, to), syncFellowshipNames)

const {
  onDrag: onHeroDrag,
  onDrop: onHeroDrop,
} = useDragDrop((from, to)=> moveOrderedName(heroOrder, from, to), syncHeroNames)

type TopLevelDragKind = 'situation' | 'fellowship' | 'hero'
let activeTopLevelDrag: TopLevelDragKind | null = null

function startedOnTopLevelDraggable(event: DragEvent) {
  const target = event.target
  const currentTarget = event.currentTarget
  if (!(target instanceof Element)) return false
  if (!(currentTarget instanceof HTMLElement)) return false

  return target.closest('[draggable="true"]') === currentTarget
}

function handleTopLevelDragStart(
  event: DragEvent,
  kind: TopLevelDragKind,
  index: number,
  onDrag: (index: number)=> void,
) {
  if (!startedOnTopLevelDraggable(event)) {
    activeTopLevelDrag = null
    return
  }

  activeTopLevelDrag = kind
  onDrag(index)
}

function handleTopLevelDrop(
  kind: TopLevelDragKind,
  index: number,
  onDrop: (index: number)=> void,
) {
  if (activeTopLevelDrag !== kind) return

  onDrop(index)
  activeTopLevelDrag = null
}

function clearTopLevelDrag() {
  activeTopLevelDrag = null
}

const situationEntries = computed(()=>
  situationNames.value
    .map(name=> {
      const shard = situations.get(name)
      const shardSituationName = shard?.get('situationName')
      const situationName = typeof shardSituationName === 'string' && shardSituationName.trim()
        ? shardSituationName
        : name

      return {
        name,
        situationName,
        shard
      }
    })
    .filter((entry): entry is SituationEntry=> !!entry.shard)
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

function situationId(situationName: string) {
  return `situation-${encodeURIComponent(situationName)}`
}

function fellowshipId(fellowshipName: string) {
  return `fellowship-${encodeURIComponent(fellowshipName)}`
}

function addSituation() {
  const situationName = newSituationName.value.trim()
  if (!situationName || situations.has(situationName)) return

  situations.set(situationName, createSituationShard({ situationName }))
  appendOrderedName(situationOrder, situationName)
  newSituationName.value = ''
}

function openSituationForm() {
  showSituationForm.value = true
}

function closeSituationForm() {
  showSituationForm.value = false
}

function openSituationImportForm() {
  situationImportError.value = ''
  showSituationImportForm.value = true
}

function closeSituationImportForm() {
  showSituationImportForm.value = false
  situationImportError.value = ''
}

function createSituationFromForm() {
  const situationName = newSituationName.value.trim()
  if (!situationName || situations.has(situationName)) return

  addSituation()
  closeSituationForm()
}

function importSituationFromYaml() {
  situationImportError.value = ''

  try {
    const situationData = parseSituationDataFromYaml(situationYamlText.value)
    const situationName = getSituationNameFromData(situationData)

    if (!situationName) {
      situationImportError.value = 'Situation YAML needs a situation name'
      return
    }

    if (situations.has(situationName)) {
      situationImportError.value = 'A situation with that name already exists'
      return
    }

    const situationShard = createSituationShardFromData(situationData)
    situations.set(situationName, situationShard)
    appendOrderedName(situationOrder, situationName)
    situationYamlText.value = ''
    closeSituationImportForm()
  } catch (e) {
    situationImportError.value = e instanceof Error ? e.message : 'Invalid situation YAML'
  }
}

function addFellowship() {
  const fellowshipName = newFellowshipName.value.trim()
  if (!fellowshipName || fellowships.has(fellowshipName)) return

  fellowships.set(fellowshipName, createFellowshipShard({ fellowshipName }))
  appendOrderedName(fellowshipOrder, fellowshipName)
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
    appendOrderedName(fellowshipOrder, fellowshipName)
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
  appendOrderedName(heroOrder, characterName)
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
    appendOrderedName(heroOrder, characterName)
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

function deleteSituation(name: string) {
  situations.delete(name)
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
    <NavigationBar
      :situations="situationEntries"
      :fellowships="fellowshipEntries"
      :heroes="heroEntries"
      @refresh="refreshTappedTags"
    />
    <div class="app-body">
      <div class="app-content">
        <Room
          id="room"
          :situations="situationEntries"
          :fellowships="fellowshipEntries"
          :heroes="heroEntries"
          @add-situation="openSituationForm"
          @import-situation="openSituationImportForm"
          @add-fellowship="openFellowshipForm"
          @import-fellowship="openFellowshipImportForm"
          @add-hero="openHeroForm"
          @import-hero="openHeroImportForm"
        />

    <div
      v-if="showSituationForm"
      class="modal-backdrop"
      @click.self="closeSituationForm"
    >
      <form class="hero-form-modal situation-form-modal" @submit.prevent="createSituationFromForm">
        <h2>Create Situation</h2>

        <label class="form-field">
          <span>Situation Name</span>
          <input
            v-model="newSituationName"
            placeholder="Enter situation name"
          />
        </label>

        <div class="modal-actions">
          <button type="button" class="secondary-button" @click="closeSituationForm">
            Cancel
          </button>
          <button type="submit">Create Situation</button>
        </div>
      </form>
    </div>
    <div
      v-if="showSituationImportForm"
      class="modal-backdrop"
      @click.self="closeSituationImportForm"
    >
      <form class="hero-form-modal situation-form-modal" @submit.prevent="importSituationFromYaml">
        <h2>Import Situation YAML</h2>

        <label class="form-field">
          <span>Situation YAML</span>
          <textarea
            v-model="situationYamlText"
            placeholder="Paste situation YAML"
            @input="situationImportError = ''"
          />
        </label>

        <p v-if="situationImportError" class="form-error">{{ situationImportError }}</p>

        <div class="modal-actions">
          <button type="button" class="secondary-button" @click="closeSituationImportForm">
            Cancel
          </button>
          <button type="submit" :disabled="!situationYamlText.trim()">Import</button>
        </div>
      </form>
    </div>
    <div class="tag-holder">
      <Situation
        v-for="(entry, index) in situationEntries"
        :id="situationId(entry.situationName)"
        :key="entry.name"
        :shard="entry.shard"
        draggable="true"
        @dragstart="handleTopLevelDragStart($event, 'situation', index, onSituationDrag)"
        @dragend="clearTopLevelDrag"
        @dragover.prevent
        @drop="handleTopLevelDrop('situation', index, onSituationDrop)"
        @delete="deleteSituation(entry.name)"
      />
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
        v-for="(entry, index) in fellowshipEntries"
        :id="fellowshipId(entry.fellowshipName)"
        :key="entry.name"
        :shard="entry.shard"
        draggable="true"
        @dragstart="handleTopLevelDragStart($event, 'fellowship', index, onFellowshipDrag)"
        @dragend="clearTopLevelDrag"
        @dragover.prevent
        @drop="handleTopLevelDrop('fellowship', index, onFellowshipDrop)"
        @delete="deleteFellowship(entry.name)"
      />
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
        v-for="(entry, index) in heroEntries"
        :id="heroId(entry.characterName)"
        :key="entry.name"
        :shard="entry.shard"
        draggable="true"
        @dragstart="handleTopLevelDragStart($event, 'hero', index, onHeroDrag)"
        @dragend="clearTopLevelDrag"
        @dragover.prevent
        @drop="handleTopLevelDrop('hero', index, onHeroDrop)"
        @delete="deleteHero(entry.name)"
      />
    </div>
      </div>
      <RollHistory />
    </div>
  </main>
</template>

<style>
main {
  height: 100vh;
  overflow: hidden;

  display: flex;
  flex-direction: column;
}

.app-body {
  flex: 1 1 auto;
  min-height: 0;

  display: flex;
  align-items: flex-start;
  overflow: hidden;
}

.app-content {
  flex: 1 1 auto;
  min-width: 0;
  height: 100%;
  overflow-y: auto;
  scrollbar-gutter: stable;
}

.character-name-row {
  display: flex;
  gap: 0.5rem;
}

.character-name-row input {
  flex: 1 1 auto;
}

@media (max-width: 32rem) {
  .character-name-row {
    flex-direction: column;
  }
}

@media (max-width: 48rem) {
  main {
    height: auto;
    overflow: visible;
  }

  .app-body {
    flex-direction: column;
    overflow: visible;
  }

  .app-content {
    width: 100%;
    height: auto;
    overflow: visible;
  }
}
</style>
