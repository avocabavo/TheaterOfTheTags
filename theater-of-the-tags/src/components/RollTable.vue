<script setup lang="ts">
import { computed } from 'vue'
import d6One from '../assets/d6-1pip.svg'
import d6Two from '../assets/d6-2pip.svg'
import d6Three from '../assets/d6-3pip.svg'
import d6Four from '../assets/d6-4pip.svg'
import d6Five from '../assets/d6-5pip.svg'
import d6Six from '../assets/d6-6pip.svg'

export type TagTableRow = {
  kind: 'tag'
  id: string
  name: string
  impact: string
  warning?: boolean
}

export type RollTableRow = {
  kind: 'roll'
  id: string
  dice: [number, number]
  impact: string
}

export type RollTableRowData = TagTableRow | RollTableRow

const props = defineProps<{
  rows: RollTableRowData[]
  rollName?: string
  color?: string
  emptyText?: string
  history?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:rollName', value: string): void
  (e: 'submit'): void
}>()

const dieImages = [
  d6One,
  d6Two,
  d6Three,
  d6Four,
  d6Five,
  d6Six,
]

function dieImage(value: number) {
  return dieImages[value - 1] ?? d6One
}

function updateRollName(event: Event) {
  if (!(event.target instanceof HTMLInputElement)) return
  emit('update:rollName', event.target.value)
}

function parseImpact(impact: string) {
  const value = Number.parseInt(impact, 10)
  return Number.isFinite(value) ? value : 0
}

function formatImpact(value: number) {
  return value > 0 ? `+${value}` : `${value}`
}

const tagRows = computed(()=> props.rows.filter(
  (row): row is TagTableRow => row.kind === 'tag'
))

const rollRow = computed(()=> props.rows.find(
  (row): row is RollTableRow => row.kind === 'roll'
) ?? null)

const modifier = computed(()=> tagRows.value.reduce(
  (total, row)=> total + parseImpact(row.impact),
  0
))

const result = computed(()=> (
  rollRow.value ? modifier.value + parseImpact(rollRow.value.impact) : null
))

const resultClass = computed(()=> {
  if (result.value == null) return ''
  if (rollRow.value?.dice[0] === 1 && rollRow.value.dice[1] === 1) return 'low-result'
  if (rollRow.value?.dice[0] === 6 && rollRow.value.dice[1] === 6) return 'high-result'
  if (result.value < 7) return 'low-result'
  if (result.value > 9) return 'high-result'
  return 'mixed-result'
})

const tableStyle = computed(()=> ({
  '--roll-table-color': props.color ?? '#1e1e2f',
}))
</script>

<template>
  <table
    :class="['roll-table', { 'history-table': history }]"
    :style="tableStyle"
  >
    <thead>
      <tr>
        <th colspan="2">
          <input
            class="roll-name-input"
            :value="props.rollName ?? 'ROLL'"
            @input="updateRollName"
            @keydown.enter.prevent="emit('submit')"
          >
        </th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="row in tagRows"
        :key="row.id"
        :class="{ 'warning-row': row.warning }"
      >
        <td>
          {{ row.name }}
        </td>
        <td class="impact-cell">{{ row.impact }}</td>
      </tr>
      <tr v-if="rows.length === 0">
        <td colspan="2" class="empty-cell">{{ emptyText ?? 'No rows' }}</td>
      </tr>
      <tr class="summary-row">
        <th scope="row">Modifier</th>
        <td class="impact-cell summary-impact">{{ formatImpact(modifier) }}</td>
      </tr>
      <tr v-if="rollRow">
        <td>
          <span class="dice-row" aria-label="2d6 roll">
            <img
              v-for="(die, index) in rollRow.dice"
              :key="`${rollRow.id}-${index}`"
              :src="dieImage(die)"
              :alt="`${die}`"
              class="die-icon"
            >
          </span>
        </td>
        <td class="impact-cell">{{ rollRow.impact }}</td>
      </tr>
      <tr v-if="result != null" class="summary-row result-row">
        <th scope="row">Result</th>
        <td :class="['impact-cell', 'summary-impact', 'result-impact', resultClass]">
          {{ result }}
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
.roll-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 0.9rem;
  color: var(--roll-table-color);
}

.roll-table th,
.roll-table td {
  padding: 0.4rem 0.35rem;
  border-top: 1px solid color-mix(in srgb, var(--roll-table-color), transparent 72%);
  text-align: left;
  vertical-align: top;
}

.roll-name-input {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: 0.35rem 0.45rem;
  border: 1px solid color-mix(in srgb, var(--roll-table-color), transparent 45%);
  border-radius: 0.25rem;
  background: rgba(255, 255, 255, 0.7);
  color: inherit;
  font: inherit;
  font-weight: 800;
  text-align: center;
}

.summary-row th,
.summary-row td {
  border-top: 0.15rem solid color-mix(in srgb, var(--roll-table-color), transparent 38%);
  font-weight: 800;
}

.result-row th,
.result-row td {
  border-top-width: 1px;
}

.roll-table th:last-child,
.roll-table td:last-child {
  width: 4rem;
  text-align: right;
}

.roll-table td:first-child {
  overflow-wrap: anywhere;
}

.impact-cell {
  font-variant-numeric: tabular-nums;
}

.summary-impact {
  color: var(--roll-table-color);
}

.result-impact {
  line-height: 1;
}

.low-result {
  font-size: 2em;
  background: var(--roll-table-color);
  color: white;
}

.high-result {
  font-size: 3em;
  font-weight: 1000;
}

.mixed-result {
  font-size: 2em;
  font-style: italic;
  border: 2px dashed var(--roll-table-color);
}

.history-table {
  background: rgba(255, 255, 255, 0.58);
}

.warning-row td {
  background: var(--roll-table-color);
  color: white;
}

.dice-row {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.die-icon {
  width: 1.8rem;
  height: 1.8rem;
  display: block;
}

.empty-cell {
  color: #666;
  font-style: italic;
  text-align: center;
}
</style>
