<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { doc, rollHistory as yRollHistory } from '../lib/yjs'
import { useMode } from '../lib/modeStore'
import {
  getInvokedTagSummaries,
  refreshTappedTags,
  rollInvokedTags,
  type InvokedTagSummary,
} from '../lib/usage'
import RollTable, {
  type RollTableRow,
  type RollTableRowData,
} from './RollTable.vue'

declare global {
  interface Window {
    testRoll?: (a: number, b: number)=> void
  }
}

type HistoryEntry = {
  id: string
  rollName: string
  rows: RollTableRowData[]
}

const widthRem = ref(15)
const invokedTags = ref<InvokedTagSummary[]>([])
const rollHistoryEntries = ref<HistoryEntry[]>([])
const historyListRef = ref<HTMLElement | null>(null)
const currentRollName = ref('ROLL')
const { mode } = useMode()

const rollColors = [
  '#500000',
  '#300030',
  '#000050',
  '#005000',
  '#2A2A2A'
]

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
      scratched: tag.kind === 'tag'
        && tag.scratched
        && (tag.nature === 'power' || tag.nature === 'primary'),
      warning,
    }
  })
})

const currentRows = computed(()=> invokedRows.value)
const warningCount = computed(()=> invokedRows.value.filter(
  row=> row.kind === 'tag' && row.warning
).length)
const hasWarnings = computed(()=> warningCount.value > 0)
const canRoll = computed(()=> mode.value === 'scene')

function rollD6() {
  return Math.floor(Math.random() * 6) + 1
}

function rootFontSize() {
  const parsed = Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 18
}

function syncInvokedTags() {
  const shouldStickToBottom = historyIsScrolledToBottom()
  invokedTags.value = getInvokedTagSummaries()

  if (shouldStickToBottom) {
    nextTick(scrollHistoryToBottom)
  }
}

function isRollTableRowData(row: any): row is RollTableRowData {
  if (!row || typeof row !== 'object') return false
  if (typeof row.id !== 'string') return false
  if (typeof row.impact !== 'string') return false

  if (row.kind === 'tag') {
    return typeof row.name === 'string'
      && (row.scratched == null || typeof row.scratched === 'boolean')
      && (row.warning == null || typeof row.warning === 'boolean')
  }

  if (row.kind === 'roll') {
    return Array.isArray(row.dice)
      && row.dice.length === 2
      && row.dice.every((die: unknown)=> Number.isInteger(die))
  }

  return false
}

function isHistoryEntry(entry: any): entry is HistoryEntry {
  return entry
    && typeof entry === 'object'
    && typeof entry.id === 'string'
    && (entry.rollName == null || typeof entry.rollName === 'string')
    && Array.isArray(entry.rows)
    && entry.rows.every(isRollTableRowData)
}

function historyIsScrolledToBottom() {
  const el = historyListRef.value
  if (!el) return true

  return el.scrollHeight - el.scrollTop - el.clientHeight <= 4
}

function scrollHistoryToBottom() {
  const el = historyListRef.value
  if (!el) return

  el.scrollTop = el.scrollHeight
}

function syncRollHistory() {
  const shouldStickToBottom = historyIsScrolledToBottom()
  rollHistoryEntries.value = yRollHistory.toArray()
    .filter(isHistoryEntry)
    .map(entry=> ({
      ...entry,
      rollName: entry.rollName || 'ROLL',
    }))

  if (shouldStickToBottom) {
    nextTick(scrollHistoryToBottom)
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
  const rows = [...invokedRows.value, rollRow]
  const rollName = currentRollName.value.trim() || 'ROLL'

  yRollHistory.push([{
    id: rollRow.id,
    rollName,
    rows,
  }])
  currentRollName.value = 'ROLL'
  rollInvokedTags()
}

function handleRoll() {
  if (!canRoll.value) return
  commitRoll(createRollRow())
}

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
  if (!isHistoryEntry(entry)) return

  const updatedEntry: HistoryEntry = {
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
  doc.on('update', syncInvokedTags)
  yRollHistory.observe(syncRollHistory)
  // Debug helper disabled. To re-enable manual dice testing from the browser
  // console, uncomment this line and the matching cleanup in onUnmounted:
  // window.testRoll = testRoll
})

onUnmounted(()=> {
  doc.off('update', syncInvokedTags)
  yRollHistory.unobserve(syncRollHistory)
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
      <div ref="historyListRef" class="history-list">
        <RollTable
          v-for="(entry, index) in rollHistoryEntries"
          :key="entry.id"
          :color="rollColors[index % rollColors.length]"
          :roll-name="entry.rollName"
          :rows="entry.rows"
          history
          @update:roll-name="value => updateHistoryRollName(entry.id, value)"
        />
      </div>

      <RollTable
        v-if="mode !== 'creation'"
        v-model:roll-name="currentRollName"
        :rows="currentRows"
        empty-text="No invoked tags"
        @submit="handleRoll"
      />

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

  padding: 0.5rem;

  display: flex;
  flex-direction: column;
  gap: 2.4rem;
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
