<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Might, ThemeType } from '../lib/schema';
import {
  mightOptions,
  originThemeTypeOptions,
  adventureThemeTypeOptions,
  greatnessThemeTypeOptions,
  themeTypeOptions
} from '../lib/schema'

const emit = defineEmits<{
  (e: 'create', payload: { might: Might, themeType: ThemeType, primaryTagName: string}): void
}>()

const might = ref<Might | ''>('')
const themeType = ref<ThemeType | ''>('')
const primaryTagName = ref<string>('')

function createTheme() {
  if (might.value == '') return
  if (themeType.value == '') return
  const trimmedPrimaryTagName = primaryTagName.value.trim()
  if (!trimmedPrimaryTagName) return

  console.log(`Creating ${might.value} - ${themeType.value} theme called ${trimmedPrimaryTagName}`)

  emit('create', {
    might: might.value,
    themeType: themeType.value,
    primaryTagName: trimmedPrimaryTagName,
  })

  primaryTagName.value = ''
}

const readyToCreate = computed(()=> {
  return (
    might.value != ''
    && themeType.value != ''
    && primaryTagName.value.length > 0
  )
})
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
  </div>
</template>

<style scoped>
.new-theme {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;

  padding: 0.75rem;
  border: 0.1rem dashed #aaa;
  border-radius: 0.5rem;
}
</style>