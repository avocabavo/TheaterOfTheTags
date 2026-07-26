<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import YAML from 'yaml'
import { currentRoll as yCurrentRoll, doc, rollHistory as yRollHistory } from '../lib/yjs'
import { useMode } from '../lib/modeStore'
import {
  getInvokedTagSummaries,
  refreshTappedTags,
  rollInvokedTags,
  type InvokedTagSummary,
} from '../lib/usage'
import {
  createRollHistoryEntryFromData,
  getRollHistoryListFromData,
  isRollHistoryEntry,
  normalizeRollHistoryEntry,
  rollHistoryEntriesToYamlData,
  type RollHistoryEntry,
} from '../lib/RollHistory'
import { stringifyYaml } from '../lib/yaml'
import RollTable, {
  type MightComparison,
  type RollTableRow,
  type RollTableRowData,
} from './RollTable.vue'
import { tagElementId } from '../lib/domIds'
import toYamlBlack from '../assets/to-yaml-black.svg'

declare global {
  interface Window {
    testRoll?: (a: number, b: number)=> void
  }
}

const widthRem = ref(15)
const invokedTags = ref<InvokedTagSummary[]>([])
const rollHistoryEntries = ref<RollHistoryEntry[]>([])
const DEFAULT_ROLL_NAME = 'ROLL NAME'
const currentRollName = ref(DEFAULT_ROLL_NAME)
const mightComparison = ref<MightComparison>('uncompared')
const showHistoryImportForm = ref(false)
const historyYamlText = ref('')
const historyImportMessage = ref('')
const historyImportError = ref('')
const { mode } = useMode()

const rollColors = [
  '#500000',
  '#000000',
  '#300030',
  '#000000',
  '#000050',
  '#000000',
  '#005000',
  '#000000',
]

const mightComparisonImpacts: Record<Exclude<MightComparison, 'uncompared'>, number> = {
  'extremely imperiled': -6,
  imperiled: -3,
  even: 0,
  favored: 3,
  'extremely favored': 6,
}

const mightComparisonOptions = Object.keys(mightComparisonImpacts) as Array<Exclude<MightComparison, 'uncompared'>>

function isMightComparison(value: unknown): value is MightComparison {
  return value === 'uncompared' || mightComparisonOptions.includes(
    value as Exclude<MightComparison, 'uncompared'>,
  )
}

function syncMightComparison() {
  const sharedComparison = yCurrentRoll.get('mightComparison')
  mightComparison.value = isMightComparison(sharedComparison)
    ? sharedComparison
    : 'uncompared'
}

function selectMightComparison(comparison: Exclude<MightComparison, 'uncompared'>) {
  if (mode.value !== 'narrator') return
  yCurrentRoll.set('mightComparison', comparison)
}

function resetMightComparison() {
  yCurrentRoll.delete('mightComparison')
}

let startingX = 0
let startingWidthPx = 0

const panelStyle = computed(()=> ({
  width: `${widthRem.value}rem`,
}))

function formatImpact(value: number) {
  return value > 0 ? `+${value}` : `${value}`
}

function statusWinnerIndex(nature: 'helpful' | 'hindering') {
  let bestTier = -1
  let bestIndex = -1

  invokedTags.value.forEach((tag, index)=> {
    if (tag.kind !== 'status' || tag.nature !== nature) return
    if (tag.tier > bestTier) {
      bestTier = tag.tier
      bestIndex = index
    }
  })

  return bestIndex
}

const invokedRows = computed<RollTableRowData[]>(()=> {
  const helpfulWinnerIndex = statusWinnerIndex('helpful')
  const hinderingWinnerIndex = statusWinnerIndex('hindering')
  let scratchedUpgradeUsed = false

  return invokedTags.value.map((tag, index)=> {
    let impact = Number.parseInt(tag.impact, 10)
    let warning = false

    if (tag.kind === 'status' && tag.nature === 'helpful' && index !== helpfulWinnerIndex) {
      warning = impact !== 0
      impact = 0
    }

    if (tag.kind === 'status' && tag.nature === 'hindering' && index !== hinderingWinnerIndex) {
      warning = impact !== 0
      impact = 0
    }

    if (
      tag.kind === 'tag'
      && tag.scratched
      && (tag.nature === 'power' || tag.nature === 'primary')
    ) {
      if (scratchedUpgradeUsed) {
        warning = impact !== 1
        impact = 1
      } else {
        scratchedUpgradeUsed = true
      }
    }

    return {
      kind: 'tag',
      id: tag.uuid,
      name: tag.name,
      impact: formatImpact(impact),
      might: tag.might,
      scratched: tag.kind === 'tag'
        && tag.scratched
        && (tag.nature === 'power' || tag.nature === 'primary'),
      ...(tag.improvementInstruction
        ? { improvementInstruction: tag.improvementInstruction }
        : {}),
      warning,
    }
  })
})

const mightComparisonRow = computed<RollTableRowData | null>(()=> {
  if (mightComparison.value === 'uncompared') return null

  return {
    kind: 'might-comparison',
    id: 'might-comparison',
    comparison: mightComparison.value,
    impact: formatImpact(mightComparisonImpacts[mightComparison.value]),
  }
})

const currentRows = computed(()=> [
  ...invokedRows.value,
  ...(mightComparisonRow.value ? [mightComparisonRow.value] : []),
])
const displayedRollHistoryEntries = computed(()=> [...rollHistoryEntries.value].reverse())
const warningCount = computed(()=> invokedRows.value.filter(
  row=> row.kind === 'tag' && row.warning
).length)
const hasWarnings = computed(()=> warningCount.value > 0)
const canRoll = computed(()=> mode.value === 'scene')
const canRollCurrentTable = computed(()=> canRoll.value && mightComparison.value !== 'uncompared')

function rollD6() {
  return Math.floor(Math.random() * 6) + 1
}

function rootFontSize() {
  const parsed = Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 18
}

function syncInvokedTags() {
  invokedTags.value = getInvokedTagSummaries()
}

function invokedRowsResetSignature() {
  return invokedTags.value
    .map(tag=> [
      tag.uuid,
      tag.kind,
      tag.nature,
      tag.scratched ? 'scratched' : 'unscratched',
      tag.tierSignature ?? '',
      tag.impact,
    ].join(':'))
    .join('|')
}

function syncRollHistory() {
  rollHistoryEntries.value = yRollHistory.toArray()
    .filter(isRollHistoryEntry)
    .map(entry=> normalizeRollHistoryEntry(entry, DEFAULT_ROLL_NAME))
}

function rollHistoryToJson() {
  return rollHistoryEntriesToYamlData(rollHistoryEntries.value)
}

function rollHistoryToYaml() {
  return stringifyYaml(rollHistoryToJson())
}

async function copyRollHistoryToClipboard() {
  await navigator.clipboard.writeText(rollHistoryToYaml())
  historyImportMessage.value = 'Roll history YAML copied.'
  historyImportError.value = ''
}

function openHistoryImportForm() {
  showHistoryImportForm.value = true
  historyImportMessage.value = ''
  historyImportError.value = ''
}

function closeHistoryImportForm() {
  showHistoryImportForm.value = false
  historyImportError.value = ''
}

function importRollHistoryFromYaml() {
  historyImportMessage.value = ''
  historyImportError.value = ''

  let data: any

  try {
    data = YAML.parse(historyYamlText.value)
  } catch (e) {
    historyImportError.value = 'Invalid YAML'
    return
  }

  const list = getRollHistoryListFromData(data)

  if (!Array.isArray(list)) {
    historyImportError.value = 'Roll history YAML must contain a rollHistory list'
    return
  }

  const importedEntries = list
    .map(entry=> createRollHistoryEntryFromData(entry, DEFAULT_ROLL_NAME))
    .filter((entry): entry is RollHistoryEntry => entry != null)
  const rejectedCount = list.length - importedEntries.length

  if (importedEntries.length) {
    yRollHistory.push(importedEntries)
  }

  historyImportMessage.value = [
    importedEntries.length ? `Imported ${importedEntries.length} roll history entries.` : 'No valid roll history entries found.',
    rejectedCount ? `Skipped ${rejectedCount} invalid entries.` : '',
  ].filter(Boolean).join(' ')

  if (importedEntries.length && rejectedCount === 0) {
    historyYamlText.value = ''
    closeHistoryImportForm()
  }
}

function createRollRow(first = rollD6(), second = rollD6()): RollTableRow {

  return {
    kind: 'roll',
    id: `roll-${crypto.randomUUID()}`,
    dice: [first, second],
    impact: `${first + second}`,
  }
}

function commitRoll(rollRow: RollTableRow) {
  const rows = [...currentRows.value, rollRow]
  const rollName = currentRollName.value.trim() || DEFAULT_ROLL_NAME

  doc.transact(()=> {
    yRollHistory.push([{
      id: rollRow.id,
      rollName,
      rows,
    }])
    resetMightComparison()
  })
  currentRollName.value = DEFAULT_ROLL_NAME
  rollInvokedTags()
}

function handleRoll() {
  if (!canRollCurrentTable.value) return
  commitRoll(createRollRow())
}

function scrollToTag(tagId: string) {
  document
    .getElementById(tagElementId(tagId))
    ?.scrollIntoView({ behavior: 'instant', block: 'center' })
}

// @ts-ignore
function testRoll(a: number, b: number) {
  if (
    !Number.isInteger(a)
    || !Number.isInteger(b)
    || a < 1
    || a > 6
    || b < 1
    || b > 6
  ) {
    console.warn('testRoll(a, b) expects two integer d6 values from 1 to 6')
    return
  }

  commitRoll(createRollRow(a, b))
}

function updateHistoryRollName(entryId: string, rollName: string) {
  const index = yRollHistory.toArray().findIndex(entry=> entry?.id === entryId)
  if (index < 0) return

  const entry = yRollHistory.get(index)
  if (!isRollHistoryEntry(entry)) return

  const updatedEntry: RollHistoryEntry = {
    ...entry,
    rollName,
  }

  yRollHistory.doc?.transact(()=> {
    yRollHistory.delete(index, 1)
    yRollHistory.insert(index, [updatedEntry])
  })
}

function handlePointerMove(event: PointerEvent) {
  const fontSize = rootFontSize()
  const minWidthPx = 10 * fontSize
  const maxWidthPx = Math.min(window.innerWidth * 0.55, 36 * fontSize)
  const nextWidthPx = startingWidthPx + startingX - event.clientX
  const clampedWidthPx = Math.max(minWidthPx, Math.min(maxWidthPx, nextWidthPx))

  widthRem.value = clampedWidthPx / fontSize
}

function stopResize() {
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerup', stopResize)
  window.removeEventListener('pointercancel', stopResize)
  document.body.classList.remove('resizing-roll-history')
}

function startResize(event: PointerEvent) {
  startingX = event.clientX
  startingWidthPx = widthRem.value * rootFontSize()

  if (event.currentTarget instanceof HTMLElement) {
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  document.body.classList.add('resizing-roll-history')
  window.addEventListener('pointermove', handlePointerMove)
  window.addEventListener('pointerup', stopResize)
  window.addEventListener('pointercancel', stopResize)
}

onMounted(()=> {
  syncInvokedTags()
  syncRollHistory()
  syncMightComparison()
  doc.on('update', syncInvokedTags)
  yRollHistory.observe(syncRollHistory)
  yCurrentRoll.observe(syncMightComparison)
  // Debug helper disabled. To re-enable manual dice testing from the browser
  // console, uncomment this line and the matching cleanup in onUnmounted:
  // window.testRoll = testRoll
})

watch(invokedRowsResetSignature, (nextSignature, previousSignature)=> {
  if (previousSignature == null) return
  if (nextSignature === previousSignature) return

  resetMightComparison()
})

onUnmounted(()=> {
  doc.off('update', syncInvokedTags)
  yRollHistory.unobserve(syncRollHistory)
  yCurrentRoll.unobserve(syncMightComparison)
  // if (window.testRoll === testRoll) {
  //   delete window.testRoll
  // }
  stopResize()
})
</script>

<template>
  <aside
    class="roll-history"
    :style="panelStyle"
    aria-label="Roll history"
  >
    <button
      type="button"
      class="resize-handle"
      aria-label="Resize roll history"
      title="Resize roll history"
      @pointerdown.prevent="startResize"
    />

    <div class="roll-history-content">
      <RollTable
        v-if="mode !== 'creation'"
        v-model:roll-name="currentRollName"
        :rows="currentRows"
        empty-text="No invoked tags"
        navigable-tags
        @navigate-tag="scrollToTag"
        @submit="handleRoll"
      />

      <div v-if="mode === 'narrator'" class="might-comparison-controls">
        <button
          v-for="option in mightComparisonOptions"
          :key="option"
          type="button"
          :class="['might-comparison-button', { selected: mightComparison === option }]"
          @click="selectMightComparison(option)"
          :title="option"
        >
          {{ formatImpact(mightComparisonImpacts[option]) }}
        </button>
      </div>

      <button
        v-if="mode === 'narrator'"
        type="button"
        class="refresh-button"
        @click="refreshTappedTags"
      >
        Refresh
      </button>

      <button
        v-if="mode === 'scene'"
        type="button"
        :class="['roll-button', { 'has-warnings': hasWarnings }]"
        :disabled="!canRollCurrentTable"
        :title="mightComparison === 'uncompared' ? 'Choose a might comparison before rolling' : 'Roll 2d6'"
        @click="handleRoll"
      >
        <span
          v-if="hasWarnings"
          class="warning-triangle"
          aria-label="Impact warning"
          title="Some invoked tag impacts were reduced by roll edge-case rules"
        >!</span>
        Roll!
        <span
          v-if="hasWarnings"
          class="warning-triangle"
          aria-label="Impact warning"
          title="Some invoked tag impacts were reduced by roll edge-case rules"
        >!</span>
      </button>

      <div class="history-list">
        <div class="roll-history-yaml-controls">
          <button
            type="button"
            class="history-yaml-button icon-history-yaml-button"
            aria-label="Copy roll history YAML"
            title="Copy roll history YAML"
            @click="copyRollHistoryToClipboard"
          >
            <img :src="toYamlBlack" alt="" class="history-yaml-icon" aria-hidden="true">
          </button>
          <button
            type="button"
            class="history-yaml-button"
            @click="openHistoryImportForm"
          >
            Import
          </button>
        </div>

        <form
          v-if="showHistoryImportForm"
          class="history-import-form"
          @submit.prevent="importRollHistoryFromYaml"
        >
          <textarea
            v-model="historyYamlText"
            placeholder="Paste roll history YAML"
            @input="historyImportError = ''"
          />
          <p v-if="historyImportMessage" class="history-import-message">{{ historyImportMessage }}</p>
          <p v-if="historyImportError" class="history-import-error">{{ historyImportError }}</p>
          <div class="history-import-actions">
            <button type="button" class="history-yaml-button" @click="closeHistoryImportForm">
              Cancel
            </button>
            <button type="submit" class="history-yaml-button" :disabled="!historyYamlText.trim()">
              Import
            </button>
          </div>
        </form>

        <p
          v-else-if="historyImportMessage"
          class="history-import-message"
        >{{ historyImportMessage }}</p>

        <RollTable
          v-for="(entry, index) in displayedRollHistoryEntries"
          :key="entry.id"
          :color="rollColors[index % rollColors.length]"
          :roll-name="entry.rollName"
          :rows="entry.rows"
          history
          @update:roll-name="value => updateHistoryRollName(entry.id, value)"
        />
      </div>
    </div>
  </aside>
</template>

<style scoped>
.roll-history {
  position: relative;
  z-index: 1;
  align-self: flex-start;
  flex: 0 0 auto;

  box-sizing: border-box;
  min-width: 10rem;
  max-width: 55vw;
  height: 100%;
  border-left: 0.2rem solid #1e1e2f;
  background: #f7f7f9;
  color: #1e1e2f;
}

.resize-handle {
  position: absolute;
  top: 0;
  left: -0.55rem;
  z-index: 10;

  width: 0.9rem;
  height: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: ew-resize;
}

.resize-handle::after {
  content: '';
  position: absolute;
  top: 0.75rem;
  bottom: 0.75rem;
  left: 0.25rem;
  width: 0.2rem;
  border-radius: 999px;
  background: rgba(30, 30, 47, 0.35);
}

.resize-handle:hover::after,
.resize-handle:focus-visible::after {
  background: rgba(30, 30, 47, 0.75);
}

:global(body.resizing-roll-history) {
  cursor: ew-resize;
  user-select: none;
}

.roll-history-content {
  box-sizing: border-box;
  height: 100%;
  padding: 0;

  display: flex;
  flex-direction: column;
  gap: 0;
}

.roll-history-heading {
  border-bottom: 0.15rem solid rgba(30, 30, 47, 0.25);
}

.label {
  margin: 0 0 0.35rem 0;
  font-size: 0.8rem;
  letter-spacing: 0;
  color: #555;
}

.history-list {
  flex: 1 1 auto;
  min-height: 2rem;
  overflow-y: scroll;
  overflow-x: hidden;

  padding: 0.5rem;

  background-color: black;

  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.roll-history-yaml-controls {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-bottom: 0.35rem;
}

.history-yaml-button {
  flex: 0 0 auto;
  min-height: 2.35rem;
  padding: 0.45rem 0.75rem;
  border: 0.12rem solid white;
  border-radius: 0.25rem;
  background: #f7f7f9;
  color: #1e1e2f;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

.history-yaml-button:disabled {
  cursor: default;
  opacity: 0.55;
}

.icon-history-yaml-button {
  width: 2.35rem;
  height: 2.35rem;
  padding: 0.35rem;
}

.history-yaml-icon {
  width: 100%;
  height: 100%;
  display: block;
}

.history-import-form {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 0.35rem;
  padding: 0.35rem;
  border: 0.12rem solid white;
  background: #f7f7f9;
  color: #1e1e2f;
}

.history-import-form textarea {
  box-sizing: border-box;
  width: 100%;
  min-height: 7rem;
  resize: vertical;
  font: inherit;
}

.history-import-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.35rem;
}

.history-import-message,
.history-import-error {
  margin: 0 0 0.35rem;
  padding: 0.25rem 0.35rem;
  background: #f7f7f9;
  color: #1e1e2f;
  font-size: 0.78rem;
  font-weight: 800;
}

.history-import-error {
  color: #8b1e1e;
}

.roll-button {
  margin: 0.5rem;
  width: auto;
  padding: 0.5rem 0.75rem;
  border: 0.15rem solid #1e1e2f;
  border-radius: 0.35rem;
  background: #1e1e2f;
  color: white;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

.might-comparison-controls {
  margin: 0.5rem 0.5rem 0;
  display: flex;
  flex-direction: row;
  gap: 0.25rem;
}

.might-comparison-button {
  width: 100%;
  padding: 0.35rem 0.45rem;
  border: 0.12rem solid #1e1e2f;
  border-radius: 0.25rem;
  background: white;
  color: #1e1e2f;
  font: inherit;
  font-size: 1.2rem;
  font-weight: 800;
  cursor: pointer;
}

.might-comparison-button.selected {
  background: #1e1e2f;
  color: white;
}

.refresh-button {
  margin: 0.5rem;
  width: auto;
  padding: 0.5rem 0.75rem;
  border: 0.15rem solid #093f12;
  border-radius: 0.35rem;
  background: #18b436;
  color: black;
  font: inherit;
  font-weight: 900;
  cursor: pointer;
}

.refresh-button:hover,
.refresh-button:focus-visible {
  background: #21d744;
}

.roll-button:hover,
.roll-button:focus-visible {
  background: #2f2f4a;
}

.roll-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.roll-button.has-warnings {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
}

.warning-triangle {
  width: 1rem;
  height: 0.9rem;
  background: #ffd94d;
  color: #1e1e2f;
  clip-path: polygon(50% 0, 100% 100%, 0 100%);
  display: inline-flex;
  align-items: flex-end;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 900;
  line-height: 0.8rem;
  padding-bottom: 0.05rem;
}

@media (max-width: 48rem) {
  .roll-history {
    width: 100% !important;
    max-width: none;
    height: auto;
    min-height: 16rem;
    border-top: 0.2rem solid #1e1e2f;
    border-left: 0;
  }

  .resize-handle {
    display: none;
  }
}
</style>
