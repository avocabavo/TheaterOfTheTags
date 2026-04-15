<script setup lang="ts">
import * as Y from 'yjs'
import Tag from './Tag.vue'
import { createTagShard } from '../lib/Tag';
import { type ThemeType, type Might } from '../lib/schema';
import { useYMapField, useYArray, useYChildMap } from '../lib/yjsComposables';
import type { TagData, TagNature, TagShard, ThemeData } from '../lib/schema';
import DeleteButton from './DeleteButton.vue';
import { useMode } from '../lib/modeStore';
import NewTag from './NewTag.vue';

const { mode } = useMode()

const props = defineProps<{
  shard: Y.Map<any>
}>()

const might = useYMapField<ThemeData, 'might'>(props.shard, 'might', 'origin')
const themeType = useYMapField<ThemeData, 'themeType'>(props.shard, 'themeType', 'circumstance')
const quest = useYMapField<ThemeData, 'quest'>(props.shard, 'quest', '')
const abandon = useYMapField<ThemeData, 'abandon'>(props.shard, 'abandon', 0)
const improve = useYMapField<ThemeData, 'improve'>(props.shard, 'improve', 0)
const milestone = useYMapField<ThemeData, 'milestone'>(props.shard, 'milestone', 0)

const { items: powerTags, push: addPowerTag, remove: removePowerTag } =
  useYArray<TagShard>(props.shard, 'powerTags')

const { items: weaknessTags, push: addWeaknessTag, remove: removeWeaknessTag } =
  useYArray<TagShard>(props.shard, 'weaknessTags')

const { child: primaryTag, clear: clearPrimaryTag, set: setPrimaryTag } = useYChildMap(
  props.shard,
  'primaryTag',
)

const mightOptions: Might[] = ['origin', 'adventure', 'greatness']

const emit = defineEmits<{
  (e: 'delete'): void
}>()

function handleCreateTag(data: {name: string, nature: TagNature, scratched: boolean}) {
  const newShard = createTagShard(data)

  switch (data.nature) {
    case 'primary':
      setPrimaryTag(newShard)
      break;
    case 'power':
      addPowerTag(newShard)
      break;
    case 'weakness':
      addWeaknessTag(newShard)
      break;
  }
}
</script>

<template>
  <div class="theme">
    <DeleteButton v-if="mode !== 'scene'" @delete="emit('delete')" />

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

    <div class="tag-section">
      <Tag
        v-if="primaryTag"
        :shard="primaryTag"
        @delete="clearPrimaryTag"
      />
      <NewTag
        v-else-if="mode !== 'scene'"
        nature="primary"
        @create="handleCreateTag"
      />
    </div>

    <div class="tag-section">
      <Tag
        v-for="(tag, index) in powerTags"
        :key="tag.get('uuid')"
        :shard="tag"
        @delete="removePowerTag(index)"
      />
      <NewTag
        v-if="mode !== 'scene'"
        nature="power"
        @create="handleCreateTag"
      />
    </div>

    <div class="tag-section">
      <Tag
        v-for="(tag, index) in weaknessTags"
        :key="tag.get('uuid')"
        :shard="tag"
        @delete="removeWeaknessTag(index)"
      />
      <NewTag
        v-if="mode !== 'scene'"
        nature="weakness"
        @create="handleCreateTag"
      />
    </div>
  </div>
</template>

<style scoped>
.theme {
  position: relative;
  border: 0.25rem solid #764;
  background-color: #dca;

  width: 25rem;

  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.the-words-theme-card {
  margin-top: 0.2rem;
  margin-bottom: 0.2rem;
  font-size: x-large;
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
  margin-top: 0.2rem;
  margin-bottom: 0.2rem;
  display: flex;
  align-items: baseline;
}

.the-word-type {
  font-size: smaller;
  color: gray;
  margin-right: 0.25rem;
}

.tag-section {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
}
</style>