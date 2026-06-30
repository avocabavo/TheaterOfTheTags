<script setup lang="ts">
import { useMode, type AppMode } from '../lib/modeStore'

defineProps<{
  heroes: {
    characterName: string
  }[]
}>()

const { mode, setMode } = useMode()

const modes: AppMode[] = ['creation', 'scene', 'narrator']

function heroId(characterName: string) {
  return `hero-${encodeURIComponent(characterName)}`
}

function heroLabel(characterName: string) {
  return characterName.slice(0, 5)
}

function scrollToHero(characterName: string) {
  document
    .getElementById(heroId(characterName))
    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <div class="navbar">
    <h1 class="title">Theater of the Tags</h1>

    <nav class="hero-navigation" aria-label="Hero navigation">
      <button
        v-for="hero in heroes"
        :key="hero.characterName"
        type="button"
        class="hero-button"
        :title="hero.characterName"
        :aria-label="`Scroll to ${hero.characterName}`"
        @click="scrollToHero(hero.characterName)"
      >
        {{ heroLabel(hero.characterName) }}
      </button>
    </nav>

    <div class="mode-switcher">
      <button
        v-for="m in modes"
        :key="m"
        type="button"
        :class="['mode-button', { active: mode === m }]"
        @click="setMode(m)"
      >
        {{ m }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;

  display: flex;
  align-items: center;
  gap: 1rem;

  padding: 0.75rem 1.5rem;

  background: linear-gradient(135deg, #1e1e2f, #2a2a40);
  color: white;

  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}

.title {
  flex: 0 0 auto;
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.hero-navigation {
  flex: 1 1 auto;
  min-width: 0;

  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding: 0.25rem 0;
}

.hero-button {
  flex: 0 0 auto;

  border: 0.2rem solid #853;
  background: #fca;
  color: #433;

  min-width: 3.25rem;
  padding: 0.4rem 0.65rem;
  border-radius: 0.5rem;

  font-size: 0.95rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
}

.hero-button:hover,
.hero-button:focus-visible {
  background: #c65;
  color: #433;
}

.mode-switcher {
  flex: 0 0 auto;
  display: flex;
  gap: 0.5rem;

  background: rgba(255, 255, 255, 0.08);
  padding: 0.75rem;
  border-radius: 999px;
}

.mode-button {
  border: none;
  background: transparent;
  color: white;

  padding: 0.4rem 0.9rem;
  border-radius: 999px;

  font-size: 0.85rem;
  text-transform: capitalize;

  cursor: pointer;
}

.mode-button.active {
  background: white;
  color: #1e1e2f;
}
</style>
