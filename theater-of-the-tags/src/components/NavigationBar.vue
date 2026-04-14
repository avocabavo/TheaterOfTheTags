<script setup lang="ts">
import { useMode, type AppMode } from '../lib/modeStore'

const { mode, setMode } = useMode()

const modes: AppMode[] = ['creation', 'scene', 'narrator']
</script>

<template>
  <div class="navbar">
    <h1 class="title">Theater of the Tags</h1>

    <div class="mode-switcher">
      <button
        v-for="m in modes"
        :key="m"
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
  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 0.75rem 1.5rem;

  background: linear-gradient(135deg, #1e1e2f, #2a2a40);
  color: white;

  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}

.title {
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: 0.05em;
}

.mode-switcher {
  display: flex;
  gap: 0.5rem;

  background: rgba(255, 255, 255, 0.08);
  padding: 0.75rem;
  border-radius: 999px;
}

.mode-button {
  border: node;
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
