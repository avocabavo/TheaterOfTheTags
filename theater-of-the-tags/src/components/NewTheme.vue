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
import newTagBlack from '../assets/new-tag-black.svg'

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
    <p class="static-words">NEW THEME</p>
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

    <div class="primary-tag-field tag new-tag primary">
      <input
        v-model="primaryTagName"
        class="tag-name-input"
        placeholder="Primary tag..."
        @keydown.enter="createTheme"
      />
      <button
        type="button"
        class="add-button"
        @click="createTheme"
        :disabled="!readyToCreate"
      >
        <img
          :src="newTagBlack"
          alt="new theme"
          class="icon"
        >
      </button>
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

.tag {
  box-sizing: border-box;
  position: relative;
  padding: 0.5rem;
  margin: 0.5rem;
  border: 0.2rem solid rgba(0, 0, 0, 0.5);
  border-radius: 2rem / 50%;

  width: 100%;
  max-width: 25rem;

  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.tag.primary {
  font-size: xx-large;
}

.tag.primary {
  background-color: gold;
  color: black;
  border-color: rgba(0, 0, 0, 0.5);
}

.new-tag {
  opacity: 0.8;
  border-style: dashed;
}

.tag-name-input {
  flex: 1 1 auto;
  min-width: 0;
  box-sizing: border-box;
  font-size: larger;
  background: rgba(255, 255, 255, 0.75);
  color: black;
}

.add-button {
  flex: 0 0 auto;
  height: 3.25rem;
  width: 3.25rem;
  margin-top: 0;
  margin-left: 0.5rem;
  border: 0.25rem solid currentColor;
  border-radius: 50%;
  background: transparent;
  color: inherit;
  cursor: pointer;

  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.add-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.icon {
  width: 100%;
  height: 100%;
  pointer-events: none;
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
