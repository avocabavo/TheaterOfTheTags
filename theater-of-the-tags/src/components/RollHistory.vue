<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { doc, rollHistory as yRollHistory } from '../lib/yjs'
import {
  getInvokedTagSummaries,
  rollInvokedTags,
  type InvokedTagSummary,
} from '../lib/usage'
import RollTable, {
  type RollTableRow,
  type RollTableRowData,
} from './RollTable.vue'

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

const invokedRows = computed<RollTableRowData[]>(()=> invokedTags.value.map(tag=> ({
  kind: 'tag',
  id: tag.uuid,
  name: tag.name,
  impact: tag.impact,
})))

const currentRows = computed(()=> invokedRows.value)

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

function createRollRow(): RollTableRow {
  const first = rollD6()
  const second = rollD6()

  return {
    kind: 'roll',
    id: `roll-${crypto.randomUUID()}`,
    dice: [first, second],
    impact: `${first + second}`,
  }
}

function handleRoll() {
  const rollRow = createRollRow()
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
})

onUnmounted(()=> {
  doc.off('update', syncInvokedTags)
  yRollHistory.unobserve(syncRollHistory)
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
      <div class="roll-history-heading">
        <p class="label">ROLL HISTORY</p>
      </div>

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
        v-model:roll-name="currentRollName"
        :rows="currentRows"
        empty-text="No invoked tags"
        @submit="handleRoll"
      />

      <button
        type="button"
        class="roll-button"
        @click="handleRoll"
      >
        Roll!
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
  padding: 0.75rem;

  display: flex;
  flex-direction: column;
  gap: 0.75rem;
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
  margin-right: -0.75rem;

  display: flex;
  flex-direction: column;
  gap: 2.4rem;
}

.roll-button {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 0.15rem solid #1e1e2f;
  border-radius: 0.35rem;
  background: #1e1e2f;
  color: white;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

.roll-button:hover,
.roll-button:focus-visible {
  background: #2f2f4a;
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
