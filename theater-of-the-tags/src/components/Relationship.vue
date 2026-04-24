<script setup lang="ts">
import { ref } from 'vue';
import YAML from 'yaml'
import { useMode } from '../lib/modeStore';
import type { RelationshipData, RelationshipShard } from '../lib/schema';
import { useYChildMap, useYMapField } from '../lib/yjsComposables';
import Tag from './Tag.vue';

const { mode } = useMode()

const props = defineProps<{
  shard: RelationshipShard
}>()

const companion = useYMapField<RelationshipData, 'companion'>(props.shard, 'companion', '')
const { child: tag } = useYChildMap(
  props.shard,
  'tag',
  ()=> emit('resized'),
)

const emit = defineEmits<{
  (e: 'delete'): void,
  (e: 'resized'): void,
}>()

const tagRef = ref<any | null>(null)


function toJson(): Object {
  return {
    companion: companion.value,
    tag: tagRef.value?.toJson() ?? null,
  }
}
function toYaml(): string {
  return YAML.stringify(toJson(), null, 2)
}
function print() {
  console.log(toYaml())
}

defineExpose({ toJson })
</script>

<template>
  <div class="relationship">
    <div>{{ companion }}</div>
    <Tag
      v-if="tag"
      :ref="tagRef"
      :shard="tag"
      @resized="emit('resized')"
    />
  </div>
</template>

<style scoped>
.relationship {
  position: relative;
  padding: 0.25rem;
  margin: 0.5rem;
  border: 0;

  width: 100%;
  max-width: 25rem;

  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.1rem solid gray;
  justify-content: space-around;
}
</style>
