<script setup lang="ts">
import * as Y from 'yjs'
import type { HeroData } from '../lib/schema';
import { useMode } from '../lib/modeStore';
import { useYMapField } from '../lib/yjsComposables';
import EditableText from './EditableText.vue';

const { mode, enableNameEditing } = useMode()

const props = defineProps<{
  shard: Y.Map<any>
}>()

const playerName = useYMapField<HeroData, 'playerName'>(props.shard, 'playerName', '')

function toJson() {
  return { playerName: playerName.value }
}

defineExpose({
  toJson
})

const emit = defineEmits<{
  (e: 'resized'): void,
}>()
</script>

<template>
  <div class="player-name">
    <div class="small static-words">
      <p>PLAYER NAME</p>
    </div>
    <EditableText
      v-model="playerName"
      tag="h3"
      placeholder="Enter Player Name ..."
      :disabled="!enableNameEditing || mode !== 'creation'"
      @resized="emit('resized')"
    />
  </div>
</template>

<style scoped>
.player-name {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;

  box-sizing: border-box;

  color: black;
}

.static-words {
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-around;

  background: #c65;
}

.static-words p {
  margin-top: 0.2rem;
  margin-bottom: 0.2rem;
  font-size: x-large;
  color: #433;
}
.static-words.small p {
  font-size: large;
}
</style>
