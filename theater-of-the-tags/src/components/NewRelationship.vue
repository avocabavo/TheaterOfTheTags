<script setup lang="ts">
import { computed, ref } from 'vue';
import type { RelationshipCreationProps } from '../lib/Relationship';
import type { TagCreationProps } from '../lib/Tag';
import NewTag from './NewTag.vue';

const emit = defineEmits<{
  (e: 'create', payload: RelationshipCreationProps): void
}>()

const companion = ref('')

function createRelationship(tagCreationProps: TagCreationProps) {
  const trimmed = companion.value.trim()
  if (!trimmed) return

  emit('create', { companion: trimmed, tag: tagCreationProps })

  companion.value = ''
}

const readyToCreate = computed(()=> companion.value.trim())
</script>

<template>
  <div class="relationship new-relationship">
    <input
      v-model="companion"
      class="companion-input"
      placeholder="add companion..."
    />
    <div class="tag-in-relationship">
      <NewTag
        nature="power"
        @create="createRelationship"
        :disabled="!readyToCreate"
      />
      <NewTag
        nature="weakness"
        @create="createRelationship"
        :disabled="!readyToCreate"
      />
    </div>
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

.new-relationship {
  opacity: 0.8;
}
</style>