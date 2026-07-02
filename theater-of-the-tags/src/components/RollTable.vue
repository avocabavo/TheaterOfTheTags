<script setup lang="ts">
import { computed } from 'vue'
import d6One from '../assets/d6-1pip.svg'
import d6Two from '../assets/d6-2pip.svg'
import d6Three from '../assets/d6-3pip.svg'
import d6Four from '../assets/d6-4pip.svg'
import d6Five from '../assets/d6-5pip.svg'
import d6Six from '../assets/d6-6pip.svg'
import scratchBlack from '../assets/scratch-black.svg'
import scratchWhite from '../assets/scratch-white.svg'

export type TagTableRow = {
  kind: 'tag'
  id: string
  name: string
  impact: string
  scratched?: boolean
  warning?: boolean
  improvementInstruction?: string
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
  navigableTags?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:rollName', value: string): void
  (e: 'submit'): void
  (e: 'navigateTag', id: string): void
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

function scratchIcon(row: TagTableRow) {
  return row.warning ? scratchWhite : scratchBlack
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
  if (rollRow.value?.dice[0] === 1 && rollRow.value.dice[1] === 1) return 'critically-low-result'
  if (rollRow.value?.dice[0] === 6 && rollRow.value.dice[1] === 6) return 'critically-high-result'
  if (result.value < 7) return 'low-result'
  if (result.value > 9) return 'high-result'
  return 'mixed-result'
})

const powerToSpend = computed(()=> Math.max(1, modifier.value))

const outcomeInstructions = computed(()=> {
  const instructions = tagRows.value
    .map(row=> row.improvementInstruction?.trim())
    .filter((instruction): instruction is string => !!instruction)

  switch (resultClass.value) {
    case 'low-result':
    case 'critically-low-result':
      instructions.push('CONSEQUENCES')
      break
    case 'mixed-result':
      instructions.push(`Spend ${powerToSpend.value} power`)
      instructions.push('CONSEQUENCES')
      break
    case 'high-result':
      instructions.push(`Spend ${powerToSpend.value} power`)
      break
    case 'critically-high-result':
      instructions.push(`Spend ${powerToSpend.value + 1} power`)
      break
  }

  return instructions
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
            :value="props.rollName ?? 'ROLL NAME'"
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
        <td class="tag-name-cell">
          <span class="tag-name-with-marker">
            <button
              v-if="navigableTags"
              type="button"
              class="tag-name-button"
              @click="emit('navigateTag', row.id)"
            >
              {{ row.name }}
            </button>
            <span v-else>{{ row.name }}</span>
            <img
              v-if="row.scratched"
              :src="scratchIcon(row)"
              alt="scratched"
              class="scratch-icon"
              title="Scratched tag"
            >
          </span>
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
      <tr v-if="result != null && outcomeInstructions.length" class="outcome-row">
        <td colspan="2">
          <ul class="outcome-list">
            <li
              v-for="(instruction, index) in outcomeInstructions"
              :key="`${instruction}-${index}`"
            >
              {{ instruction }}
            </li>
          </ul>
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

.roll-table:not(.history-table) {
  border: 0.25rem solid black;
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

.outcome-row td {
  border-top-width: 1px;
  font-weight: 900;
  text-align: left;
}

.outcome-list {
  margin: 0;
  padding-left: 1.1rem;
}

.outcome-list li + li {
  margin-top: 0.25rem;
}

.outcome-list li {
  text-align: left;
}

.roll-table th:last-child,
.roll-table td:last-child {
  width: 4rem;
  text-align: right;
}

.roll-table td:first-child {
  overflow-wrap: anywhere;
}

.tag-name-cell {
  min-width: 0;
}

.tag-name-with-marker {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  max-width: 100%;
}

.tag-name-button {
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  overflow-wrap: anywhere;
  cursor: pointer;
}

.tag-name-button:hover,
.tag-name-button:focus-visible {
  text-decoration: underline;
}

.scratch-icon {
  flex: 0 0 auto;
  width: 1.1rem;
  height: 1.1rem;
  display: inline-block;
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

.critically-low-result {
  font-size: 1em;
  background: var(--roll-table-color);
  color: white;
  border: 2px dashed var(--roll-table-color);
}

.high-result {
  font-size: 3em;
  font-weight: 1000;
}

.critically-high-result {
  font-size: 5em;
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
