<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Might, ThemeType } from '../lib/schema';
import {
  mightOptions,
  // originThemeTypeOptions,
  // adventureThemeTypeOptions,
  // greatnessThemeTypeOptions,
  themeTypeOptions,
} from '../lib/schema'
import { createThemeShardFromYaml, type ThemeCreationProps } from '../lib/Theme';
import type { ThemeShard } from '../lib/schema';

const emit = defineEmits<{
  (e: 'create', payload: ThemeCreationProps): void
  (e: 'import', payload: ThemeShard): void
}>()

const might = ref<Might | ''>('')
const themeType = ref<ThemeType | ''>('')
const primaryTagName = ref<string>('')
const yamlText = ref('')
const importError = ref('')

function createTheme() {
  if (might.value == '') return
  if (themeType.value == '') return
  const trimmedPrimaryTagName = primaryTagName.value.trim()
  if (!trimmedPrimaryTagName) return

  emit('create', {
    might: might.value,
    themeType: themeType.value,
    primaryTagName: trimmedPrimaryTagName,
  })

  primaryTagName.value = ''
}

function importTheme() {
  importError.value = ''

  try {
    emit('import', createThemeShardFromYaml(yamlText.value))
    yamlText.value = ''
  } catch (e) {
    importError.value = e instanceof Error ? e.message : 'Invalid theme YAML'
  }
}

const readyToCreate = computed(()=> {
  return (
    might.value != ''
    && themeType.value != ''
    && primaryTagName.value.length > 0
  )
})

const readyToImport = computed(()=> yamlText.value.trim().length > 0)
</script>

<template>
  <div class="theme new-theme">
    <p class="static-words">NEW THEME CARD</p>
    <div class="might">
      <label
        v-for="option in mightOptions"
        :key="option"
        class="might-option"
      >
        <input
          type="radio"
          v-model="might"
          :value="option"
          :checked="might === option"
          @change="might = option"
        />
        {{ option }}
      </label>
    </div>

    <div class="field">
      <select v-model="themeType" class="select">
        <option disabled value="">Select type...</option>
        <option
          v-for="option in themeTypeOptions"
          :key="option"
          :value="option"
        >
          {{ option }}
        </option>
      </select>
    </div>

    <div class="field">
      <input
        v-model="primaryTagName"
        class="input"
        placeholder="Primary tag..."
        @keydown.enter="createTheme"
      />
    </div>

    <button
      class="create-button"
      :disabled="!readyToCreate"
      @click="createTheme"
    >
      Create
    </button>

    <div class="import-section">
      <p class="static-words">IMPORT YAML</p>
      <textarea
        v-model="yamlText"
        class="yaml-input"
        placeholder="Paste theme YAML..."
        @input="importError = ''"
      />
      <p v-if="importError" class="import-error">{{ importError }}</p>
      <button
        class="create-button"
        :disabled="!readyToImport"
        @click="importTheme"
      >
        Import
      </button>
    </div>
  </div>
</template>

<style scoped>
.new-theme {
  box-sizing: border-box;
  border: 0.25rem dashed white;
  background-color: #222;

  width: 25rem;

  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;

  padding: 0.75rem;
}

.import-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding-top: 0.5rem;
  border-top: 0.1rem solid rgba(255, 255, 255, 0.25);
}

.yaml-input {
  box-sizing: border-box;
  width: 100%;
  min-height: 7rem;
  resize: vertical;
}

.import-error {
  margin: 0;
  color: #ffb3b3;
  font-size: 0.9rem;
  text-align: center;
}
</style>
