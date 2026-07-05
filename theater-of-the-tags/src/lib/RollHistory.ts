import type { MightComparison, RollTableRowData } from '../components/RollTable.vue'

export type RollHistoryEntry = {
  id: string
  rollName: string
  rows: RollTableRowData[]
}

export function isRollTableRowData(row: any): row is RollTableRowData {
  if (!row || typeof row !== 'object') return false
  if (typeof row.id !== 'string') return false
  if (typeof row.impact !== 'string') return false

  if (row.kind === 'tag') {
    return typeof row.name === 'string'
      && (row.scratched == null || typeof row.scratched === 'boolean')
      && (row.warning == null || typeof row.warning === 'boolean')
      && (row.might == null || typeof row.might === 'string')
      && (row.improvementInstruction == null || typeof row.improvementInstruction === 'string')
  }

  if (row.kind === 'might-comparison') {
    return typeof row.comparison === 'string'
      && row.comparison !== 'uncompared'
  }

  if (row.kind === 'roll') {
    return Array.isArray(row.dice)
      && row.dice.length === 2
      && row.dice.every((die: unknown)=> Number.isInteger(die))
  }

  return false
}

export function isRollHistoryEntry(entry: any): entry is RollHistoryEntry {
  return entry
    && typeof entry === 'object'
    && typeof entry.id === 'string'
    && (entry.rollName == null || typeof entry.rollName === 'string')
    && Array.isArray(entry.rows)
    && entry.rows.every(isRollTableRowData)
}

export function normalizeRollHistoryEntry(entry: RollHistoryEntry, defaultRollName = 'ROLL NAME'): RollHistoryEntry {
  return {
    ...entry,
    rollName: entry.rollName || defaultRollName,
  }
}

export function getRollHistoryListFromData(data: any): unknown {
  if (Array.isArray(data)) return data
  return data?.rollHistory
}

function rollRowToYaml(row: RollTableRowData) {
  switch (row.kind) {
    case 'tag':
      return {
        kind: row.kind,
        name: row.name,
        impact: row.impact,
        ...(row.might ? { might: row.might } : {}),
        ...(row.scratched != null ? { scratched: row.scratched } : {}),
        ...(row.warning != null ? { warning: row.warning } : {}),
        ...(row.improvementInstruction ? { improvementInstruction: row.improvementInstruction } : {}),
      }
    case 'might-comparison':
      return {
        kind: row.kind,
        comparison: row.comparison,
        impact: row.impact,
      }
    case 'roll':
      return {
        kind: row.kind,
        dice: row.dice,
        impact: row.impact,
      }
  }
}

export function rollHistoryEntryToYaml(entry: RollHistoryEntry) {
  return {
    rollName: entry.rollName,
    rows: entry.rows.map(rollRowToYaml),
  }
}

export function rollHistoryEntriesToYamlData(entries: RollHistoryEntry[]) {
  return {
    rollHistory: entries.map(rollHistoryEntryToYaml),
  }
}

const importedMightComparisonOptions: Array<Exclude<MightComparison, 'uncompared'>> = [
  'extremely imperiled',
  'imperiled',
  'even',
  'favored',
  'extremely favored',
]

function isImportedMightComparison(value: unknown): value is Exclude<MightComparison, 'uncompared'> {
  return importedMightComparisonOptions.includes(value as Exclude<MightComparison, 'uncompared'>)
}

function createRollTableRowFromData(row: any): RollTableRowData | null {
  if (!row || typeof row !== 'object') return null
  if (typeof row.impact !== 'string') return null

  if (row.kind === 'tag') {
    if (typeof row.name !== 'string') return null

    return {
      kind: 'tag',
      id: `imported-tag-${crypto.randomUUID()}`,
      name: row.name,
      impact: row.impact,
      ...(typeof row.might === 'string' ? { might: row.might } : {}),
      ...(typeof row.scratched === 'boolean' ? { scratched: row.scratched } : {}),
      ...(typeof row.warning === 'boolean' ? { warning: row.warning } : {}),
      ...(typeof row.improvementInstruction === 'string'
        ? { improvementInstruction: row.improvementInstruction }
        : {}),
    }
  }

  if (row.kind === 'might-comparison') {
    if (!isImportedMightComparison(row.comparison)) return null

    return {
      kind: 'might-comparison',
      id: `might-comparison-${crypto.randomUUID()}`,
      comparison: row.comparison,
      impact: row.impact,
    }
  }

  if (row.kind === 'roll') {
    if (
      !Array.isArray(row.dice)
      || row.dice.length !== 2
      || !row.dice.every((die: unknown)=> Number.isInteger(die))
    ) {
      return null
    }

    return {
      kind: 'roll',
      id: `roll-${crypto.randomUUID()}`,
      dice: [row.dice[0], row.dice[1]],
      impact: row.impact,
    }
  }

  return null
}

export function createRollHistoryEntryFromData(entry: any, defaultRollName = 'ROLL NAME'): RollHistoryEntry | null {
  if (!entry || typeof entry !== 'object') return null
  if (!Array.isArray(entry.rows)) return null

  const rows = entry.rows.map(createRollTableRowFromData)
  if (rows.some(row=> row == null)) return null

  return {
    id: `roll-history-${crypto.randomUUID()}`,
    rollName: typeof entry.rollName === 'string' && entry.rollName.trim()
      ? entry.rollName
      : defaultRollName,
    rows: rows as RollTableRowData[],
  }
}
