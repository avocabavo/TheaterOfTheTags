<script setup lang="ts">
import * as Y from 'yjs'
import { useMode } from '../lib/modeStore';
import DeleteButton from './DeleteButton.vue';
import { useYMapField } from '../lib/yjsComposables';
import type { HeroData } from '../lib/schema';
import Bubbles from './Bubbles.vue';

const { mode } = useMode()

const props = defineProps<{
  shard: Y.Map<any>
}>()

const characterName = useYMapField<HeroData, 'characterName'>(props.shard, 'characterName', '')
const playerName = useYMapField<HeroData, 'playerName'>(props.shard, 'playerName', '')

const emit = defineEmits<{
  (e: 'delete'): void
}>()

</script>

<template>
  <div class="hero">
    <div class="hero-card">
      <DeleteButton v-if="mode !== 'scene'" @delete="emit('delete')" />

      <p class="the-words-hero-card">HERO CARD</p>
      <div class="character-name">
        <h1>{{ characterName }}</h1>
      </div>
      <div class="player-name">
        <h1>{{ playerName }}</h1>
      </div>

      <div class="tag-section">
        <Bubbles
          :shard="shard"
          field="promise"
          :max="5"
          name="PROMISE"
        />
      </div>
    </div>
  </div>
</template>

<style>
.hero {
  position: relative;
  border: 3px solid violet;

  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: start;
  gap: 1rem;
}

.hero-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.the-words-hero-card {
  margin-top: 0.2rem;
  margin-bottom: 0.2rem;
  font-size: x-large;
  color: gray;
}
</style>