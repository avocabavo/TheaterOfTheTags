<script setup lang="ts">
import * as Y from 'yjs'
import type { HeroData } from '../lib/schema';
import { useMode } from '../lib/modeStore';
import { useYMapField } from '../lib/yjsComposables';
import { ref } from 'vue';
import { useWatchWithDebounce } from '../lib/util';

const { mode } = useMode()

const props = defineProps<{
  shard: Y.Map<any>
}>()

const characterName = useYMapField<HeroData, 'characterName'>(props.shard, 'characterName', '')

const localValue = ref(characterName.value)

useWatchWithDebounce(characterName, localValue)

function toJson() {
  return { characterName: localValue.value }
}

defineExpose({
  toJson
})
</script>

<template>
  <div class="character-name">
    <h1>{{ characterName }}</h1>
  </div>
</template>

<style scoped>
.character-name {
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 1rem;

  color: black;
}
</style>