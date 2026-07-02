<script setup lang="ts">
import YAML from 'yaml'
import type { StatusTagShard, TagShard } from '../lib/schema';
import Tag from './Tag.vue';
import { ref } from 'vue';
import StatusTag from './StatusTag.vue';

const props = defineProps<{
  shard: TagShard | StatusTagShard
}>()

const tagRef = ref<any>()
const statusRef = ref<any>()

const emit = defineEmits<{
  (e: 'resized'): void,
  (e: 'delete'): void,
}>()

function toJson() {
  if (props.shard.has('tiers')) {
    return statusRef.value.toJson()
  } else {
    return tagRef.value.toJson()
  }
}

function print() {
  console.log(YAML.stringify(toJson(), null, 2))
}

defineExpose({toJson})

</script>

<template>
  <div class="loose-tag" @click="print">
    <div class="tag-section">
      <StatusTag
        v-if="shard.has('tiers')"
        ref="statusRef"
        :shard="shard"
        name-editable-mode="narrator"
        @delete="emit('delete')"
        @resized="emit('resized')"
      />
      <Tag
        v-else
        ref="tagRef"
        :shard="shard"
        name-editable-mode="narrator"
        @delete="emit('delete')"
        @resized="emit('resized')"
      />
    </div>
  </div>
</template>

<style scoped>
.loose-tag {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  background: #444;

  border: 0.25rem solid black;

  box-sizing: border-box;
  width: 25rem;
}

.tag-section {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
}
</style>
