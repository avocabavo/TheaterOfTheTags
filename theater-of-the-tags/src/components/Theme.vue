<script setup lang="ts">
import * as Y from 'yjs'
import Tag from './Tag.vue'
import { createTagShard } from '../lib/Tag';
import { type ThemeType, type Might } from '../lib/schema';
import { useYMapField, useYArray, useYChildMap } from '../lib/yjsComposables';
import type { TagShard, ThemeData } from '../lib/schema';
import DeleteButton from './DeleteButton.vue';

const props = defineProps<{
  shard: Y.Map<any>
}>()

const might = useYMapField<ThemeData, 'might'>(props.shard, 'might', 'origin')
const themeType = useYMapField<ThemeData, 'themeType'>(props.shard, 'themeType', 'circumstance')
const quest = useYMapField<ThemeData, 'quest'>(props.shard, 'quest', '')
const abandon = useYMapField<ThemeData, 'abandon'>(props.shard, 'abandon', 0)
const improve = useYMapField<ThemeData, 'improve'>(props.shard, 'improve', 0)
const milestone = useYMapField<ThemeData, 'milestone'>(props.shard, 'milestone', 0)

const { items: powerTags, push: addPowerTag } =
  useYArray<TagShard>(props.shard, 'powerTags')

const { items: weaknessTags, push: addWeaknessTag } =
  useYArray<TagShard>(props.shard, 'weaknessTags')

const themeTag = useYChildMap(
  props.shard,
  'themeTag',
)

const mightOptions: Might[] = ['origin', 'adventure', 'greatness']

const emit = defineEmits<{
  (e: 'delete'): void
}>()
</script>

<template>
  <div class="theme">
    <DeleteButton @delete="emit('delete')" />

    <p class="the-words-theme-card">THEME CARD</p>
    <div class="might">
      <label
        v-for="option in mightOptions"
        :key="option"
        class="might-option"
      >
        <input
          type="radio"
          name="might"
          :value="option"
          :checked="might === option"
          @change="might = option"
        />
        {{ option }}
      </label>
    </div>
    <p class="theme-type">
      <span class="the-word-type">type</span>
      {{ themeType }}
    </p>

    <Tag v-if="themeTag" :shard="themeTag" />

    <div class="tag-section">
      <Tag
        v-for="tag in powerTags.value"
        :key="tag.get('uuid')"
        :shard="tag"
      />
      <button @click="addPowerTag(createTagShard({ name: '', nature: 'power'}))">+ Add</button>
    </div>

    <div class="tag-section">
      <Tag
        v-for="tag in weaknessTags.value"
        :key="tag.get('uuid')"
        :shard="tag"
      />
      <button @click="addWeaknessTag(createTagShard({ name: '', nature: 'weakness'}))">+ Add</button>
    </div>
  </div>
</template>

<style scoped>
.theme {
  position: relative;
  border: 0.25rem solid #764;
  background-color: #dca;

  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.the-words-theme-card {
  font-size: small;
  color: gray;
}

.might {
  display: flex;
  gap: 0.75rem;
}

.might-option {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
}

.theme-type {
  display: flex;
  align-items: baseline;
}

.the-word-type {
  font-size: smaller;
  color: gray;
  margin-right: 0.25rem;
}

.tag-section {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
}
</style>