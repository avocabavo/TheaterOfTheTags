<script setup lang="ts">
import * as Y from 'yjs'
import YAML from 'yaml'
import { computed, ref } from 'vue'
import {
  fellowships,
  heroes,
  roomName,
  situations,
} from '../lib/yjs'
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

const props = defineProps<{
  situations: SituationEntry[]
  fellowships: FellowshipEntry[]
  heroes: HeroEntry[]
}>()

const showImportForm = ref(false)
const roomYamlText = ref('')
const importMessage = ref('')
const importError = ref('')

const displayRoomName = computed(()=> decodeURIComponent(roomName || '/'))

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

  const results = [
    importCollection(
      'Situation',
      data.situations,
      getSituationNameFromData,
      name=> situations.has(name),
      (name, item)=> situations.set(name, createSituationShardFromData(item)),
    ),
    importCollection(
      'Fellowship',
      data.fellowships,
      getFellowshipNameFromData,
      name=> fellowships.has(name),
      (name, item)=> fellowships.set(name, createFellowshipShardFromData(item)),
    ),
    importCollection(
      'Hero',
      data.heroes,
      getHeroCharacterNameFromData,
      name=> heroes.has(name),
      (name, item)=> heroes.set(name, createHeroShardFromData(item)),
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
  padding: 1rem 1.5rem;
  border-bottom: 0.15rem solid rgba(255, 255, 255, 0.18);
  background: #282838;
  color: white;
}

.room-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.label {
  margin: 0;
  color: #c9c9d8;
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
  border: 0.15rem solid #aaa;
  border-radius: 0.35rem;
  background: #f4f4f4;
  color: #222;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
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
  .room-heading,
  .room-actions,
  .modal-actions {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
