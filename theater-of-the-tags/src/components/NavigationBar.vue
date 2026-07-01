<script setup lang="ts">
import { computed } from 'vue'
import { useMode, type AppMode } from '../lib/modeStore'

const props = defineProps<{
  situations: {
    situationName?: string
  }[]
  fellowships: {
    fellowshipName?: string
  }[]
  heroes: {
    characterName?: string
  }[]
}>()

const { mode, setMode } = useMode()

const modes: AppMode[] = ['creation', 'scene', 'narrator']

const navigableSituations = computed(()=> props.situations.filter(
  (situation): situation is { situationName: string }=>
    typeof situation.situationName === 'string' && situation.situationName.trim().length > 0
))

const navigableFellowships = computed(()=> props.fellowships.filter(
  (fellowship): fellowship is { fellowshipName: string }=>
    typeof fellowship.fellowshipName === 'string' && fellowship.fellowshipName.trim().length > 0
))

const navigableHeroes = computed(()=> props.heroes.filter(
  (hero): hero is { characterName: string }=>
    typeof hero.characterName === 'string' && hero.characterName.trim().length > 0
))

function situationId(situationName: string) {
  return `situation-${encodeURIComponent(situationName)}`
}

function fellowshipId(fellowshipName: string) {
  return `fellowship-${encodeURIComponent(fellowshipName)}`
}

function heroId(characterName: string) {
  return `hero-${encodeURIComponent(characterName)}`
}

function navLabel(name: string) {
  return name.slice(0, 5)
}

function scrollToSituation(situationName: string) {
  document
    .getElementById(situationId(situationName))
    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function scrollToFellowship(fellowshipName: string) {
  document
    .getElementById(fellowshipId(fellowshipName))
    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
        v-for="situation in navigableSituations"
        :key="situation.situationName"
        type="button"
        class="nav-button situation-button"
        :title="situation.situationName"
        :aria-label="`Scroll to ${situation.situationName}`"
        @click="scrollToSituation(situation.situationName)"
      >
        {{ navLabel(situation.situationName) }}
      </button>
      <button
        v-for="fellowship in navigableFellowships"
        :key="fellowship.fellowshipName"
        type="button"
        class="nav-button fellowship-button"
        :title="fellowship.fellowshipName"
        :aria-label="`Scroll to ${fellowship.fellowshipName}`"
        @click="scrollToFellowship(fellowship.fellowshipName)"
      >
        {{ navLabel(fellowship.fellowshipName) }}
      </button>
      <button
        v-for="hero in navigableHeroes"
        :key="hero.characterName"
        type="button"
        class="nav-button hero-button"
        :title="hero.characterName"
        :aria-label="`Scroll to ${hero.characterName}`"
        @click="scrollToHero(hero.characterName)"
      >
        {{ navLabel(hero.characterName) }}
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

.nav-button {
  flex: 0 0 auto;

  min-width: 3.25rem;
  padding: 0.4rem 0.65rem;
  border-radius: 0.5rem;

  font-size: 0.95rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
}

.situation-button {
  border: 0.2rem solid #777;
  background: #f4f4f4;
  color: #222;
}

.fellowship-button {
  border: 0.2rem solid #2c7ea0;
  background: #bfe9ff;
  color: #12384a;
}

.hero-button {
  border: 0.2rem solid #853;
  background: #fca;
  color: #433;
}

.situation-button:hover,
.situation-button:focus-visible {
  background: #d7d7d7;
  color: #222;
}

.fellowship-button:hover,
.fellowship-button:focus-visible {
  background: #62b7dc;
  color: #12384a;
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
