<script setup lang="ts">
import type { StatusNature, TagNature } from '../lib/schema';
import NewStatusTag from './NewStatusTag.vue';
import NewTag from './NewTag.vue';

function handleCreateTag(data: {name: string, nature: TagNature, scratched: boolean}) {
  emit('createTag', data)
}

function handleCreateStatus(data: {name: string, nature: StatusNature, tiers?: boolean[]}) {
  emit('createStatus', data)
}

const emit = defineEmits<{
  (e: 'createTag', payload: { name: string; nature: TagNature; scratched: boolean}): void
  (e: 'createStatus', payload: { name: string; nature: StatusNature; tiers?: boolean[] }): void
}>()

</script>

<template>
  <div class="new-loose-tags">
    <div class="tag-section">
      <NewTag
        nature="primary"
        @create="handleCreateTag"
      />
      <NewTag
        nature="weakness"
        @create="handleCreateTag"
      />
      <NewStatusTag
        nature="helpful"
        @create="handleCreateStatus"
      />
      <NewStatusTag
        nature="hindering"
        @create="handleCreateStatus"
      />
    </div>
  </div>
</template>

<style scoped>
.new-loose-tags {
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