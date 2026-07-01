<script setup lang="ts">
import * as Y from 'yjs'
import YAML from 'yaml'
import { computed, nextTick, onMounted, ref } from 'vue'
import {
  fellowships as fellowshipMap,
  heroes as heroMap,
  room,
  roomName,
  situations as situationMap,
} from '../lib/yjs'
import { useMode } from '../lib/modeStore'
import { useYMapField } from '../lib/yjsComposables'
import { useWatchWithDebounce } from '../lib/util'
import {
  createFellowshipShardFromData,
  getFellowshipNameFromData,
} from '../lib/Fellowship'
import {
  createHeroShardFromData,
  getHeroCharacterNameFromData,
} from '../lib/Hero'
import {
  createSituationShardFromData,
  getSituationNameFromData,
} from '../lib/Situation'
import toYamlBlack from '../assets/to-yaml-black.svg'

type SituationEntry = {
  situationName: string
  shard: Y.Map<any>
}

type FellowshipEntry = {
  fellowshipName: string
  shard: Y.Map<any>
}

type HeroEntry = {
  characterName: string
  shard: Y.Map<any>
}

type ImportResult = {
  label: string
  successes: string[]
  failures: string[]
}

type RoomData = {
  roomDescription: string
}

const props = defineProps<{
  situations: SituationEntry[]
  fellowships: FellowshipEntry[]
  heroes: HeroEntry[]
}>()

const { mode } = useMode()

const emit = defineEmits<{
  (e: 'add-situation'): void
  (e: 'import-situation'): void
  (e: 'add-fellowship'): void
  (e: 'import-fellowship'): void
  (e: 'add-hero'): void
  (e: 'import-hero'): void
}>()

const showImportForm = ref(false)
const roomYamlText = ref('')
const importMessage = ref('')
const importError = ref('')

const displayRoomName = computed(()=> decodeURIComponent(roomName || '/'))
const situationCount = computed(()=> props.situations.length)
const fellowshipCount = computed(()=> props.fellowships.length)
const heroCount = computed(()=> props.heroes.length)
const roomDescription = useYMapField<RoomData, 'roomDescription'>(
  room,
  'roomDescription',
  ''
)
const localRoomDescription = ref(roomDescription.value)
const descriptionRef = ref<HTMLTextAreaElement | null>(null)

useWatchWithDebounce(roomDescription, localRoomDescription, null, autoResizeDescription)

function autoResizeDescription() {
  const el = descriptionRef.value
  if (!el) return

  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

onMounted(()=> {
  nextTick(autoResizeDescription)
})

function valueToJson(value: any): any {
  if (value instanceof Y.Map) {
    return mapToJson(value)
  }

  if (value instanceof Y.Array) {
    return value.toArray().map(valueToJson)
  }

  return value
}

function mapToJson(map: Y.Map<any>) {
  return Object.fromEntries(
    Array.from(map.entries())
      .filter(([key])=> key !== 'uuid')
      .map(([key, value])=> [key, valueToJson(value)])
  )
}

function toJson() {
  return {
    roomDescription: roomDescription.value,
    situations: props.situations.map(entry=> mapToJson(entry.shard)),
    fellowships: props.fellowships.map(entry=> mapToJson(entry.shard)),
    heroes: props.heroes.map(entry=> mapToJson(entry.shard)),
  }
}

function toYaml() {
  return YAML.stringify(toJson(), null, 2)
}

async function copyToClipboard() {
  await navigator.clipboard.writeText(toYaml())
  importMessage.value = 'Room YAML copied.'
  importError.value = ''
}

function openImportForm() {
  showImportForm.value = true
  importMessage.value = ''
  importError.value = ''
}

function closeImportForm() {
  showImportForm.value = false
  importError.value = ''
}

function importCollection(
  label: string,
  data: unknown,
  getName: (item: any)=> string,
  hasName: (name: string)=> boolean,
  addItem: (name: string, item: any)=> void,
): ImportResult {
  const result: ImportResult = {
    label,
    successes: [],
    failures: [],
  }

  if (data == null) return result

  if (!Array.isArray(data)) {
    result.failures.push(`${label} must be a list`)
    return result
  }

  data.forEach((item, index)=> {
    const name = getName(item)
    const itemLabel = name || `item ${index + 1}`

    if (!name) {
      result.failures.push(`${itemLabel}: missing name`)
      return
    }

    if (hasName(name)) {
      result.failures.push(`${name}: name already exists`)
      return
    }

    try {
      addItem(name, item)
      result.successes.push(name)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'invalid data'
      result.failures.push(`${itemLabel}: ${message}`)
    }
  })

  return result
}

function formatImportMessage(results: ImportResult[]) {
  const successes = results.flatMap(result=>
    result.successes.map(name=> `${result.label} ${name}`)
  )
  const failures = results.flatMap(result=>
    result.failures.map(message=> `${result.label} ${message}`)
  )

  const parts: string[] = []

  if (successes.length) {
    parts.push(`Imported ${successes.length}: ${successes.join(', ')}.`)
  }

  if (failures.length) {
    parts.push(`Could not import ${failures.length}: ${failures.join('; ')}.`)
  }

  return parts.join(' ')
}

function importRoom() {
  importMessage.value = ''
  importError.value = ''

  let data: any

  try {
    data = YAML.parse(roomYamlText.value)
  } catch (e) {
    importError.value = 'Invalid YAML'
    return
  }

  if (!data || typeof data !== 'object') {
    importError.value = 'Room YAML must be an object'
    return
  }

  if (typeof data.roomDescription === 'string') {
    roomDescription.value = data.roomDescription
  }

  const results = [
    importCollection(
      'Situation',
      data.situations,
      getSituationNameFromData,
      name=> situationMap.has(name),
      (name, item)=> situationMap.set(name, createSituationShardFromData(item)),
    ),
    importCollection(
      'Fellowship',
      data.fellowships,
      getFellowshipNameFromData,
      name=> fellowshipMap.has(name),
      (name, item)=> fellowshipMap.set(name, createFellowshipShardFromData(item)),
    ),
    importCollection(
      'Hero',
      data.heroes,
      getHeroCharacterNameFromData,
      name=> heroMap.has(name),
      (name, item)=> heroMap.set(name, createHeroShardFromData(item)),
    ),
  ]

  const message = formatImportMessage(results)
  importMessage.value = message || 'No situations, fellowships, or heroes found to import.'

  if (results.every(result=> result.failures.length === 0)) {
    roomYamlText.value = ''
    closeImportForm()
  }
}
</script>

<template>
  <section class="room">
    <div class="tome">
      <div class="page page-left">
        <div class="room-heading">
          <div>
            <p class="label">ROOM</p>
            <h2>{{ displayRoomName }}</h2>
          </div>

          <div class="room-actions">
            <button
              type="button"
              class="icon-button"
              aria-label="Copy room YAML"
              title="Copy room YAML"
              @click="copyToClipboard"
            >
              <img :src="toYamlBlack" alt="" class="copy-icon" aria-hidden="true">
            </button>
            <button type="button" @click="openImportForm">Import Room</button>
          </div>
        </div>

        <p v-if="importMessage" class="import-message">{{ importMessage }}</p>
        <p v-if="importError" class="import-error">{{ importError }}</p>

        <div class="room-description">
          <textarea
            ref="descriptionRef"
            v-model="localRoomDescription"
            class="description-input"
            :disabled="mode !== 'narrator'"
            placeholder="Enter room description..."
            @input="autoResizeDescription"
          />
        </div>
      </div>

      <div class="page page-right">
        <div class="collection-box situation-box">
          <div>
            <p class="box-label">SITUATIONS</p>
            <p class="box-count">{{ situationCount }}</p>
          </div>
          <div class="box-actions">
            <button type="button" @click="emit('add-situation')">Add</button>
            <button type="button" @click="emit('import-situation')">Import</button>
          </div>
        </div>

        <div class="collection-box fellowship-box">
          <div>
            <p class="box-label">FELLOWSHIPS</p>
            <p class="box-count">{{ fellowshipCount }}</p>
          </div>
          <div class="box-actions">
            <button type="button" @click="emit('add-fellowship')">Add</button>
            <button type="button" @click="emit('import-fellowship')">Import</button>
          </div>
        </div>

        <div class="collection-box hero-box">
          <div>
            <p class="box-label">HEROES</p>
            <p class="box-count">{{ heroCount }}</p>
          </div>
          <div class="box-actions">
            <button type="button" @click="emit('add-hero')">Add</button>
            <button type="button" @click="emit('import-hero')">Import</button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showImportForm"
      class="modal-backdrop"
      @click.self="closeImportForm"
    >
      <form class="room-import-modal" @submit.prevent="importRoom">
        <h2>Import Room</h2>

        <label class="form-field">
          <span>Room YAML</span>
          <textarea
            v-model="roomYamlText"
            placeholder="Paste room YAML"
            @input="importError = ''"
          />
        </label>

        <p v-if="importMessage" class="import-message">{{ importMessage }}</p>
        <p v-if="importError" class="import-error">{{ importError }}</p>

        <div class="modal-actions">
          <button type="button" class="secondary-button" @click="closeImportForm">
            Cancel
          </button>
          <button type="submit" :disabled="!roomYamlText.trim()">Import</button>
        </div>
      </form>
    </div>
  </section>
</template>

<style scoped>
.room {
  box-sizing: border-box;
  width: 100%;
  padding: 1.5rem;
  display: flex;
  justify-content: center;
  color: #2d2418;
  scroll-margin-top: 5.5rem;
}

.tome {
  position: relative;
  box-sizing: border-box;
  width: min(100%, 68rem);
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: stretch;
  filter: drop-shadow(0 0.45rem 0.65rem rgba(0, 0, 0, 0.25));
}

.tome::before {
  content: "";
  position: absolute;
  top: 0.65rem;
  bottom: 0.65rem;
  left: 50%;
  width: 0.22rem;
  transform: translateX(-50%);
  background: linear-gradient(90deg, #9a7b52, #f0d9ad, #7a5b36);
  border-radius: 999rem;
  z-index: 1;
}

.page {
  box-sizing: border-box;
  min-height: 17rem;
  padding: 1.15rem;
  border: 0.22rem solid #8c6a3e;
  background:
    linear-gradient(90deg, rgba(139, 103, 59, 0.12), transparent 12%, transparent 88%, rgba(139, 103, 59, 0.1)),
    #f8e8c8;
}

.page-left {
  border-right-width: 0.1rem;
  border-radius: 1.25rem 0.3rem 0.3rem 1.25rem;
}

.page-right {
  border-left-width: 0.1rem;
  border-radius: 0.3rem 1.25rem 1.25rem 0.3rem;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.room-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.label {
  margin: 0;
  color: #705632;
  font-size: 0.8rem;
  font-weight: 700;
}

.room h2 {
  margin: 0.1rem 0 0;
  font-size: 1.35rem;
}

.room-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.room button {
  flex: 0 0 auto;
  padding: 0.45rem 0.75rem;
  border: 0.15rem solid #8c6a3e;
  border-radius: 0.35rem;
  background: #fff7df;
  color: #2d2418;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.room button:hover,
.room button:focus-visible {
  background: white;
}

.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.35rem;
  height: 2.35rem;
  padding: 0.35rem;
}

.copy-icon {
  width: 1rem;
  height: 1rem;
}

.import-message,
.import-error {
  margin: 0.75rem 0 0;
  font-weight: 600;
}

.import-message {
  color: #923727;
}

.import-error {
  color: #923727;
}

.room-description {
  width: 100%;
  margin-top: 1rem;
}

.description-input {
  width: 100%;
  display: block;
  box-sizing: border-box;

  min-height: 12rem;
  overflow: hidden;
  resize: none;

  font-size: larger;
  line-height: 1.4;

  padding: 0.75rem 0.85rem;

  border: 0.1rem solid #d6c7a1;
  border-radius: 0.5rem;

  background: linear-gradient(180deg, #f8f1d4 0%, #efe4b0 100%);
  color: #4a3b1f;

  box-shadow:
    inset 0 0 0.5rem rgba(0,0,0,0.08),
    0 0.1rem 0.25rem rgba(0,0,0,0.1);

  outline: none;
}

.description-input::placeholder {
  color: #8a7a4f;
}

.description-input:disabled {
  opacity: 1;
}

.collection-box {
  box-sizing: border-box;
  min-height: 4.65rem;
  padding: 0.65rem;
  border: 0.2rem solid;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.situation-box {
  border-color: #777;
  background: #f4f4f4;
  color: #222;
}

.fellowship-box {
  border-color: #2c7ea0;
  background: #bfe9ff;
  color: #12384a;
}

.hero-box {
  border-color: #853;
  background: #fca;
  color: #433;
}

.box-label,
.box-count {
  margin: 0;
}

.box-label {
  font-size: 0.8rem;
  font-weight: 800;
}

.box-count {
  font-size: 1.8rem;
  font-weight: 800;
  line-height: 1;
}

.box-actions {
  display: flex;
  gap: 0.4rem;
}

.collection-box button {
  padding: 0.35rem 0.55rem;
  border-color: currentColor;
  background: rgba(255, 255, 255, 0.65);
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 220;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 1rem;
  background: rgba(0, 0, 0, 0.55);
}

.room-import-modal {
  box-sizing: border-box;
  width: min(100%, 32rem);
  padding: 1rem;
  border: 0.25rem solid #777;
  border-radius: 0.5rem;

  display: flex;
  flex-direction: column;
  gap: 0.85rem;

  background: #f4f4f4;
  color: #222;
}

.room-import-modal h2 {
  margin: 0;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-weight: 600;
}

.form-field textarea {
  box-sizing: border-box;
  width: 100%;
  min-height: 16rem;
  min-width: 0;
  padding: 0.45rem 0.55rem;
  border: 0.15rem solid #777;
  border-radius: 0.25rem;
  resize: vertical;
  font: inherit;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.room-import-modal .secondary-button {
  background: white;
}

.room button:disabled {
  cursor: default;
  opacity: 0.55;
}

@media (max-width: 32rem) {
  .room {
    padding: 1rem;
  }

  .tome {
    grid-template-columns: 1fr;
  }

  .tome::before {
    display: none;
  }

  .page-left,
  .page-right {
    border-width: 0.22rem;
    border-radius: 1rem;
  }

  .page-right {
    margin-top: 0.75rem;
  }

  .room-heading,
  .room-actions,
  .collection-box,
  .box-actions,
  .modal-actions {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
